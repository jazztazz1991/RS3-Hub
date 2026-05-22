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
function extractMetadata($) {
  const box = $('table.questdetails').first();
  if (!box.length) return {};
  const out = { raw: {} };
  box.find('[data-attr-param]').each((_, el) => {
    const key = $(el).attr('data-attr-param');
    const val = $(el).text().replace(/\s+/g, ' ').trim();
    out.raw[key] = val;
  });
  // Friendly aliases for the most commonly used ones
  out.start = out.raw.startDisp || null;
  out.members = out.raw.membersDisp || null;
  out.length = out.raw.length || null;
  out.items = out.raw.itemsDisp || null;
  out.recommended = out.raw.recommendedDisp || null;
  out.kills = out.raw.kills || null;
  return out;
}

// `table.questreq` lists quest + skill prerequisites. Lines are usually
// pipe/colon-separated; we split into an array of strings for the UI to render.
function extractRequirements($) {
  const tbl = $('table.questreq').first();
  if (!tbl.length) return [];
  const lines = [];
  tbl.find('tr').each((_, tr) => {
    const text = $(tr).text().replace(/\s+/g, ' ').trim();
    if (text) lines.push(text);
  });
  return lines;
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
