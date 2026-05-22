// Parse a quest's Quick guide subpage on the RS3 wiki into structured data:
//   { quest, metadata, requirements, sections: [{ name, steps: [...] }] }
//
// Strategy: fetch the rendered HTML via action=parse, walk the DOM in
// document order tracking the current <h2> section, and classify each
// element we encounter:
//   - <table.questdetails>      → metadata box
//   - <table.questreq>          → requirements
//   - <table> (no class, first cell is a number) → step table
//
// Step tables are this wiki's convention for representing one quest action
// (often a dialogue tree). Each row is a dialogue choice or sub-step.
const axios = require('axios');
const cheerio = require('cheerio');

const WIKI_BASE = 'https://runescape.wiki';
const USER_AGENT = process.env.WIKI_USER_AGENT ||
  'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)';

const http = axios.create({
  baseURL: WIKI_BASE,
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  timeout: 30000,
});

const SKIP_SECTIONS = new Set([
  'Overview', 'Required for completing', 'Rewards', 'Contents',
]);

// Pull rich metadata from `[data-attr-param]` cells inside the .questdetails table.
// For list-shaped fields (items, recommended) we extract the <li> children
// as an array so the UI can render a proper list instead of run-on prose.
function extractMetadata($) {
  const box = $('table.questdetails').first();
  if (!box.length) return {};
  const out = { raw: {} };
  box.find('[data-attr-param]').each((_, el) => {
    const key = $(el).attr('data-attr-param');
    const val = $(el).text().replace(/\s+/g, ' ').trim();
    out.raw[key] = val;
  });

  // Helper: pull leading <i> "disclaimer" (italic preamble) + the <ul> items.
  // Returns { disclaimer, items: [string] } when a UL is present, else null.
  function extractListField(paramKey) {
    const cell = box.find(`[data-attr-param="${paramKey}"]`).first();
    if (!cell.length) return null;
    const ul = cell.find('ul').first();
    if (!ul.length) return null;
    // Disclaimer: leading <i> sibling of the UL (or anywhere before it in the cell)
    let disclaimer = null;
    const $i = cell.find('i').first();
    if ($i.length) disclaimer = $i.text().replace(/\s+/g, ' ').trim();
    // List items
    const items = [];
    ul.children('li').each((_, li) => {
      const text = $(li).text().replace(/\s+/g, ' ').trim();
      if (text) items.push(text);
    });
    return { disclaimer, items };
  }

  // Friendly aliases for the most commonly used ones
  out.start = out.raw.startDisp || null;
  out.members = out.raw.membersDisp || null;
  out.length = out.raw.length || null;
  out.kills = out.raw.kills || null;
  // Items + recommended: structured lists when available, raw text otherwise
  out.items_list = extractListField('itemsDisp');
  out.recommended_list = extractListField('recommendedDisp');
  out.items = out.raw.itemsDisp || null;
  out.recommended = out.raw.recommendedDisp || null;
  return out;
}

// `table.questreq` lists prerequisites by category (Quests / Skills / Items).
// Each <th> is a category label, followed by a <tr> containing a nested
// <ul> tree of required quests (with their own sub-prereqs nested inside).
// Returns: [{ label, items: [{ name, href, children: [...] }] }]
function parseReqList($, $ul) {
  const items = [];
  $ul.children('li').each((_, li) => {
    const $li = $(li);
    // Pick the FIRST anchor in the li for the name + href (skip image-only links)
    const $a = $li.find('> a, > span > a').first();
    let name = '';
    let href = null;
    if ($a.length) {
      name = $a.text().replace(/\s+/g, ' ').trim();
      href = $a.attr('href') || null;
    }
    if (!name) {
      // Fallback: take direct text only (avoiding any nested ul content)
      const $clone = $li.clone();
      $clone.find('ul').remove();
      name = $clone.text().replace(/\s+/g, ' ').trim();
    }
    // Recurse into the nested ul (transitive prereqs)
    const $nested = $li.children('ul').first();
    const children = $nested.length ? parseReqList($, $nested) : [];
    if (name) items.push({ name, href, children });
  });
  return items;
}

function extractRequirements($) {
  const tbl = $('table.questreq').first();
  if (!tbl.length) return [];
  const categories = [];
  let pending = null;
  tbl.find('tr').each((_, tr) => {
    const $tr = $(tr);
    const $th = $tr.find('th').first();
    if ($th.length) {
      // Category label row (e.g. "Quests:")
      const label = $th.text().replace(/\s+/g, ' ').trim().replace(/:\s*$/, '');
      pending = { label, items: [] };
      categories.push(pending);
      return;
    }
    if (!pending) return;
    const $ul = $tr.find('ul').first();
    if ($ul.length) {
      pending.items = parseReqList($, $ul);
    } else {
      // No nested list — single-row fact (e.g. an item line)
      const text = $tr.text().replace(/\s+/g, ' ').trim();
      if (text) pending.items.push({ name: text, href: null, children: [] });
    }
  });
  // Drop empty categories
  return categories.filter(c => c.items.length);
}

// Document-order DFS. Tracks the current section + the most recent prose
// "action" paragraph, so each step table gets its "Talk to X" context.
//
// Quick guides on the wiki interleave:
//   <p>Talk to Arianwyn.</p>
//   <table>dialogue choices</table>
//   <p>Use the Crystal teleport seed.</p>
//   <table>...</table>
// The action paragraph identifies WHO to talk to or WHAT to do; the table
// is the dialogue tree to navigate. We group them.
function extractSections($) {
  const sections = [];
  let current = null;
  let lastAction = null; // { text, links }

  function pushCurrent() {
    if (current && current.steps.length) sections.push(current);
  }

  function collectLinks($el) {
    const links = [];
    $el.find('a[title]').each((_, a) => {
      const $a = $(a);
      const title = $a.attr('title');
      const display = $a.text().trim();
      if (!title || !display || display.length < 2) return;
      if (!links.find(l => l.title === title)) {
        links.push({ title, display, href: $a.attr('href') });
      }
    });
    return links;
  }

  function visit(node) {
    if (!node) return;
    const $node = $(node);
    const tag = (node.tagName || '').toLowerCase();

    if (tag === 'h2') {
      const name = $node.find('.mw-headline').text().trim() || $node.text().trim();
      pushCurrent();
      if (SKIP_SECTIONS.has(name)) {
        current = null;
        lastAction = null;
        return;
      }
      current = { name, steps: [] };
      lastAction = null;
      return;
    }

    // Quick guides actually wrap action prose in <li>, not <p>. We capture
    // both, but skip LIs inside navboxes / requirements (those are nav, not
    // step content).
    if ((tag === 'p' || tag === 'li') && current) {
      // Skip if this li is inside a navbox or quest-requirements table.
      if (tag === 'li' && $node.closest('.navbox, .questreq, .questdetails, .messagebox').length) {
        // Still recurse in case there's nested step content (rare).
        if (node.children) for (const c of node.children) visit(c);
        return;
      }
      // Clone, strip inner tables (those are the dialogue rows, captured
      // separately), then take .text() — that keeps anchor link text
      // ("Talk to Maisa") but drops nested-table content.
      const $clone = $node.clone();
      $clone.find('table').remove();
      const text = $clone.text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 2) {
        lastAction = { text, links: collectLinks($clone) };
      }
      // Recurse into the LI's children so we still find nested step tables.
      if (node.children) for (const c of node.children) visit(c);
      return;
    }

    if (tag === 'table' && current) {
      const cls = $node.attr('class') || '';
      const firstCellText = $node.find('tr').first().children().first().text().trim();
      const isStepTable = !cls && /^[\d✓~]+$/.test(firstCellText.split(/\s+/)[0] || '');
      if (isStepTable) {
        const rows = [];
        $node.find('tr').each((_, tr) => {
          const $tr = $(tr);
          const cells = $tr.children();
          const num = cells.eq(0).text().trim();
          const text = cells.eq(1).text().replace(/\s+/g, ' ').trim();
          if (text) rows.push({ num, text, links: collectLinks($tr) });
        });
        if (rows.length) {
          current.steps.push({
            action: lastAction,        // the "Talk to X" line that preceded this dialogue
            rows,
          });
          lastAction = null;           // consumed
        }
        return;
      }
    }

    // For containers/lists, recurse so we still see the elements inside.
    if (node.children) {
      for (const c of node.children) visit(c);
    }
  }

  const root = $('.mw-parser-output')[0];
  visit(root);
  pushCurrent();

  // Sections sometimes have a leading prose paragraph but no dialogue table
  // (pure narrative step). Capture those too as steps with no `rows`.
  // We do a second pass to catch standalone <p> followed by another <p> or
  // section break — though for v1, the table-anchored model covers the
  // bulk of the content.
  return sections;
}

async function fetchQuestQuickGuide(questTitle) {
  const page = `${questTitle}/Quick guide`;
  const res = await http.get('/api.php', {
    params: {
      action: 'parse',
      page,
      format: 'json',
      prop: 'text|displaytitle',
      redirects: 1,
    },
  });
  if (res.data?.error) {
    const err = new Error(`Wiki parse error for "${page}": ${res.data.error.info}`);
    err.code = res.data.error.code;
    err.status = res.data.error.code === 'missingtitle' ? 404 : 500;
    throw err;
  }
  const parse = res.data?.parse;
  if (!parse) throw new Error(`No parse result for "${page}"`);
  const $ = cheerio.load(parse.text['*']);

  return {
    quest: questTitle,
    page_title: parse.title,
    wiki_url: `${WIKI_BASE}/w/${encodeURIComponent(parse.title)}`,
    metadata: extractMetadata($),
    requirements: extractRequirements($),
    sections: extractSections($),
  };
}

module.exports = { fetchQuestQuickGuide };
