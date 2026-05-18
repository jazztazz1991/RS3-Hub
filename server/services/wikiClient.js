// RS3 Wiki client — fetches and parses item pages from runescape.wiki.
//
// Strategy: use MediaWiki's action=parse to get rendered HTML, then parse
// with cheerio. The wiki tags infobox cells with data-attr-param
// attributes (e.g. data-attr-param="tradeable"), so we target those
// instead of fragile label text.
const axios = require('axios');
const cheerio = require('cheerio');

const WIKI_API = 'https://runescape.wiki/api.php';
const WIKI_BASE = 'https://runescape.wiki';

const USER_AGENT = process.env.WIKI_USER_AGENT ||
  'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com; contact via site Suggestions form)';

const http = axios.create({
  baseURL: WIKI_BASE,
  headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
  timeout: 30000,
});

function slugify(pageTitle) {
  return pageTitle
    // Disambiguate meaningful characters before the strip pass so
    // "Antipoison+" and "Antipoison++" don't collide.
    .replace(/\+/g, '_plus')
    .replace(/&/g, '_and')
    .replace(/'/g, '')
    .replace(/\s+/g, '_')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    // Anything still non-alphanumeric becomes an underscore, then collapse runs.
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function absoluteImageUrl(src) {
  if (!src) return null;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return WIKI_BASE + src;
  return src;
}

function parseBool(text) {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (t === 'yes') return true;
  if (t === 'no') return false;
  return null;
}

// PG INTEGER max
const PG_INT_MAX = 2147483647;
const PG_INT_MIN = -2147483648;

function parseInt0(text) {
  if (text == null) return null;
  const cleaned = String(text).replace(/[^\d-]/g, '');
  if (!cleaned) return null;
  // Reject obviously concatenated-garbage values (e.g. wiki rendering bugs
  // that smash multiple shop quantities into one cell).
  if (cleaned.replace(/^-/, '').length > 10) return null;
  const n = parseInt(cleaned, 10);
  if (!Number.isFinite(n)) return null;
  if (n > PG_INT_MAX || n < PG_INT_MIN) return null;
  return n;
}

function parseFloat0(text) {
  if (text == null) return null;
  const cleaned = String(text).replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseRarityFraction(text) {
  if (!text) return null;
  const t = String(text).trim();
  if (/always/i.test(t)) return 1;
  const m = t.match(/(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const num = parseInt(m[1], 10), den = parseInt(m[2], 10);
    if (den > 0) return num / den;
  }
  return null;
}

// Lists all page titles in a wiki category, paginating via cmcontinue.
// Pass either "Potions" or "Category:Potions" — both work.
async function listCategoryMembers(category, options = {}) {
  const { limit = 500, namespace = 0 } = options;
  const cmtitle = category.startsWith('Category:') ? category : `Category:${category}`;
  const titles = [];
  let cmcontinue = null;

  while (true) {
    const params = {
      action: 'query',
      list: 'categorymembers',
      cmtitle,
      cmlimit: limit,
      cmnamespace: namespace,
      format: 'json',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    const res = await http.get('/api.php', { params });
    if (res.data?.error) {
      throw new Error(`Wiki query error for ${cmtitle}: ${res.data.error.info}`);
    }
    const members = res.data?.query?.categorymembers || [];
    for (const m of members) titles.push(m.title);
    cmcontinue = res.data?.continue?.cmcontinue;
    if (!cmcontinue) break;
  }
  return titles;
}

async function fetchParsedPage(pageTitle) {
  const res = await http.get('/api.php', {
    params: {
      action: 'parse',
      page: pageTitle,
      format: 'json',
      prop: 'text|sections|displaytitle|categories',
      redirects: 1,
    },
  });
  if (res.data?.error) {
    const err = new Error(`Wiki parse error for "${pageTitle}": ${res.data.error.info}`);
    err.code = res.data.error.code;
    throw err;
  }
  const parse = res.data?.parse;
  if (!parse) throw new Error(`No parse result for "${pageTitle}"`);
  return {
    title: parse.title,
    displayTitle: parse.displaytitle,
    html: parse.text?.['*'] || '',
    sections: parse.sections || [],
    // Categories come back as [{ "*": "Potions", hidden: '...', sortkey: '...' }]
    // We want the display names with underscores -> spaces.
    categories: (parse.categories || [])
      .filter(c => !c.hidden) // skip maintenance/template categories
      .map(c => (c['*'] || '').replace(/_/g, ' '))
      .filter(Boolean),
  };
}

function extractInfobox($) {
  const $box = $('.infobox-item').first();
  if (!$box.length) return null;

  const props = {};
  $box.find('td[data-attr-param]').each((_, el) => {
    const key = $(el).attr('data-attr-param');
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    props[key] = text;
  });

  const $img = $box.find('img').first();
  const image_url = $img.length ? absoluteImageUrl($img.attr('src')) : null;

  // "kept" cell looks like: "ReclaimableValue: 2,953Reclaim: 100"
  const kept = props.kept || '';
  const reclaimable = /reclaimable/i.test(kept);
  const valueMatch = kept.match(/value:\s*([\d,]+)/i);
  const reclaimMatch = kept.match(/reclaim:\s*([\d,]+)/i);

  const backpack_options = props.options
    ? props.options.split(',').map(s => s.trim()).filter(Boolean)
    : null;

  return {
    raw: props,
    image_url,
    examine_text: props.examine || null,
    release_date: props.release || null,
    members: parseBool(props.members),
    quest_item: parseBool(props.quest),
    tradeable: parseBool(props.tradeable),
    equipable: parseBool(props.equipable),
    stackable: parseBool(props.stackable),
    noteable: parseBool(props.noteable),
    disassemblable: parseBool(props.disassembly),
    destroy_method: props.destroy || null,
    backpack_options,
    ge_value: parseInt0(props.value),
    high_alch: parseInt0(props.high),
    low_alch: parseInt0(props.low),
    weight_kg: parseFloat0(props.weight),
    ge_buy_limit: parseInt0(props.buylimit),
    ge_volume_static: parseInt0(props.volume), // historical volume from infobox; live volume comes from WeirdGloop
    ge_item_id: parseInt0(props.id),           // useful for WeirdGloop lookups by id
    on_death_reclaimable: kept ? reclaimable : null,
    on_death_value: valueMatch ? parseInt0(valueMatch[1]) : null,
    on_death_cost: reclaimMatch ? parseInt0(reclaimMatch[1]) : null,
  };
}

// The recipe table is one flat <table.infobox-recipe>. Walk rows top-to-bottom,
// using <th> header rows to switch between sections (Members/Ticks → Skill →
// Material → Output → Profit). Rebuilt from inspection of actual page HTML.
function parseRecipeTable($, $table) {
  const recipe = {
    materials: [],
    output_quantity: 1,
    members_only: null,
    ticks: null,
    skill: null,
    level: null,
    xp: null,
    total_cost: null,
  };

  let section = 'meta'; // meta | skill | material | output

  $table.find('> tbody > tr, > tr').each((_, tr) => {
    const $tr = $(tr);
    const $children = $tr.children();
    if (!$children.length) return;

    const isHeaderRow = $children.toArray().every(el => el.tagName === 'th');
    const text = $tr.text().replace(/\s+/g, ' ').trim();

    if (isHeaderRow) {
      if (/skill\s*level\s*experience/i.test(text)) section = 'skill';
      else if (/material\s*quantity\s*cost/i.test(text)) section = 'material';
      else if (/output\s*quantity\s*cost/i.test(text)) section = 'output';
      else if (/^requirements$/i.test(text)) section = 'meta';
      return;
    }

    // Meta rows: label in first td/th, value in second td.
    const firstLabel = $children.first().text().replace(/\s+/g, ' ').trim();
    if (section === 'meta') {
      const $tds = $tr.children('td');
      if (/^members$/i.test(firstLabel)) recipe.members_only = parseBool($tds.last().text());
      else if (/^ticks$/i.test(firstLabel)) recipe.ticks = $tds.last().text().replace(/\s+/g, ' ').trim();
      return;
    }

    if (section === 'skill') {
      const $tds = $tr.children('td');
      if ($tds.length >= 3) {
        recipe.skill = $tds.eq(0).find('a').first().text().trim() || $tds.eq(0).text().trim();
        recipe.level = parseInt0($tds.eq(1).text());
        recipe.xp = parseFloat0($tds.eq(2).text());
      }
      return;
    }

    if (section === 'material') {
      // Row structure: <td img> <td name> <td qty> <td cost>
      // Or summary rows: <th "Total cost"> <td value>
      const $tds = $tr.children('td');
      if ($children.first().is('th') && /total cost/i.test(firstLabel)) {
        recipe.total_cost = parseInt0($tds.last().text());
        return;
      }
      if ($tds.length >= 3) {
        const $nameCell = $tds.eq($tds.length - 3);
        const name = $nameCell.find('a').first().text().trim() || $nameCell.text().trim();
        const qty = parseInt0($tds.eq($tds.length - 2).text());
        const cost = parseInt0($tds.eq($tds.length - 1).text());
        if (name) recipe.materials.push({ name, quantity: qty || 1, cost });
      }
      return;
    }

    if (section === 'output') {
      const $tds = $tr.children('td');
      if ($children.first().is('th') && /profit/i.test(firstLabel)) {
        return; // not stored separately for now
      }
      if ($tds.length >= 3) {
        recipe.output_quantity = parseInt0($tds.eq($tds.length - 2).text()) || 1;
      }
      return;
    }
  });

  return recipe;
}

function extractRecipes($) {
  const recipes = [];
  // Capture a variant label from the immediately preceding "tabber" element if present,
  // or fall back to numeric variant_N.
  $('table.infobox-recipe').each((i, table) => {
    const $t = $(table);
    const parsed = parseRecipeTable($, $t);

    // Variant label: many pages use a tabber to show alt methods.
    // Look back for a tab link with active class.
    let variant = null;
    const $tabber = $t.closest('.tabbertab');
    if ($tabber.length) variant = $tabber.attr('title') || null;
    parsed.variant_label = variant || (i > 0 ? `variant_${i}` : null);

    if (parsed.skill || parsed.materials.length || parsed.xp != null) {
      recipes.push(parsed);
    }
  });
  return recipes;
}

// Products table: one <table.products-list>. The materials column contains
// a nested sub-table whose <tr>s are also reachable via .find('tbody > tr'),
// so we navigate strictly via direct children. Body rows commonly carry an
// extra leading image cell that the header doesn't account for — we detect
// the offset and shift indices accordingly.
function extractProducts($) {
  const products = [];
  const $table = $('table.products-list').first();
  if (!$table.length) return products;

  // Header row lives in the first child <tr> of the outer tbody and contains
  // only <th>. Build a column-index map from it.
  const $headerCells = $table.children('tbody').children('tr').first().children('th');
  const headers = [];
  $headerCells.each((_, th) => {
    headers.push($(th).text().replace(/\s+/g, ' ').trim().toLowerCase());
  });
  if (!headers.length) return products;
  const col = (label) => headers.findIndex(h => h.includes(label));

  const idxProduct = col('product');
  const idxMembers = col('member');
  const idxSkills = col('skill');
  const idxExp = col('experience');
  const idxMaterials = col('material');
  const idxGePrice = col('ge price');
  const idxGeVolume = col('ge volume');

  // Only outer-tbody direct-child rows — skip the header row and any nested
  // sub-table rows (which we'll pick up separately via the materials cell).
  $table.children('tbody').children('tr').each((rowIdx, tr) => {
    if (rowIdx === 0) return; // header row
    const $tr = $(tr);
    const $cells = $tr.children('td');
    if (!$cells.length) return;

    // Body rows can have a leading image cell that headers don't represent.
    // Use the offset to align cell index with header index.
    const offset = $cells.length - headers.length; // typically 0 or 1
    const cellAt = (headerIdx) => $cells.eq(headerIdx >= 0 ? headerIdx + offset : -1);

    const $productCell = cellAt(idxProduct);
    const $productLink = $productCell.find('a[title]').filter((_, a) => !!$(a).text().trim()).first();
    const productName = ($productLink.text().trim() || $productCell.text().trim())
      .replace(/^\d+\s*[x×]\s*/i, '').trim();
    const productHref = $productLink.attr('href') || '';
    const slugMatch = productHref.match(/\/w\/(.+)$/);
    const output_item_slug = slugMatch
      ? slugify(decodeURIComponent(slugMatch[1].replace(/_/g, ' ')))
      : null;

    const qtyMatch = $productCell.text().match(/(\d+)\s*[x×]/);
    const output_quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    const $membersCell = cellAt(idxMembers);
    const membersText = $membersCell.find('img').attr('alt') || $membersCell.text();
    const members_only = membersText ? /member/i.test(membersText) : null;

    const $skillsCell = cellAt(idxSkills);
    const skillName = $skillsCell.find('a[title]').first().attr('title') || null;
    const level = parseInt0($skillsCell.attr('data-sort-value') || $skillsCell.text());

    const $expCell = cellAt(idxExp);
    const xp = parseFloat0($expCell.attr('data-sort-value') || $expCell.text());

    // Materials: parse the nested table inside the materials cell. Each
    // inner row has 3 cells (qty text, image link, name link). Pick the
    // anchor with a title.
    const materials = [];
    const $matCell = cellAt(idxMaterials);
    const $matRows = $matCell.find('tr');
    if ($matRows.length) {
      $matRows.each((_, mtr) => {
        const $mcells = $(mtr).children('td');
        if (!$mcells.length) return;
        const fullText = $(mtr).text().replace(/\s+/g, ' ').trim();
        const qtyTextMatch = fullText.match(/(\d+)\s*[x×]/);
        const matQty = qtyTextMatch ? parseInt(qtyTextMatch[1], 10) : 1;
        // Last cell with a non-numeric anchor title is the material name
        const matName = $(mtr).find('a[title]').filter((_, a) => {
          const text = $(a).text().trim();
          return text && !/^\d+$/.test(text);
        }).last().attr('title');
        if (matName) materials.push({ name: matName, quantity: matQty });
      });
    } else {
      // Fallback: walk all anchor titles, dedupe
      const seen = new Set();
      $matCell.find('a[title]').each((_, a) => {
        const $a = $(a);
        const title = $a.attr('title');
        const text = $a.text().trim();
        if (!title || !text || /^\d+$/.test(text)) return;
        if (seen.has(title)) return;
        seen.add(title);
        materials.push({ name: title, quantity: 1 });
      });
    }

    const $priceCell = cellAt(idxGePrice);
    const $volumeCell = cellAt(idxGeVolume);
    const ge_price = idxGePrice >= 0
      ? parseInt0($priceCell.attr('data-sort-value') || $priceCell.text())
      : null;
    const ge_volume = idxGeVolume >= 0
      ? parseInt0($volumeCell.attr('data-sort-value') || $volumeCell.text())
      : null;

    if (productName) {
      products.push({
        output_item_name: productName,
        output_item_slug,
        output_quantity,
        skill: skillName,
        level,
        xp,
        members_only,
        materials,
        ge_price: ge_price === 0 || ge_price === -1 ? null : ge_price,
        ge_volume: ge_volume === 0 || ge_volume === -1 ? null : ge_volume,
      });
    }
  });

  return products;
}

// Disassembly: scan rows; each material row pairs a <th data-discalc-mat=NAME>
// with a <td data-discalc-chance-fraction="X/Y" data-discalc-chance-percent="P">.
function extractDisassembly($) {
  const $box = $('.rsw-infobox-disassembly').first();
  if (!$box.length) return null;
  const get = (key) => $box.find(`[data-attr-param="${key}"]`).first().text().replace(/\s+/g, ' ').trim();

  // Junk chance text looks like "? 98.9%Your actual junk chance..." — pull the
  // numeric value from the dedicated data attribute instead.
  const $junkCell = $box.find('[data-discalc-junk]').first();
  const junkPct = parseFloat0($junkCell.attr('data-discalc-junk'));
  const junk_chance = junkPct == null ? null : (junkPct > 1 ? junkPct / 100 : junkPct);

  const materials = [];
  $box.find('tr').each((_, tr) => {
    const $tr = $(tr);
    const $matTh = $tr.find('th[data-discalc-mat]').first();
    if (!$matTh.length) return;
    const $chanceTd = $tr.find('td[data-discalc-chance], td[data-discalc-chance-fraction]').first();
    materials.push({
      name: $matTh.attr('data-discalc-mat'),
      chance_fraction: $chanceTd.attr('data-discalc-chance-fraction') || null,
      chance_percent: parseFloat0($chanceTd.attr('data-discalc-chance-percent')),
      chance: (() => {
        const p = parseFloat0($chanceTd.attr('data-discalc-chance-percent'));
        return p == null ? null : (p > 1 ? p / 100 : p);
      })(),
    });
  });

  return {
    category: get('catlink') || null,
    disassembly_xp: parseFloat0(get('xp')),
    item_quantity_required: parseInt0(get('itemqty')) || 1,
    junk_chance,
    materials,
  };
}

// Drops / Item sources — each drop table on the wiki carries class
// `item-drops`. We target those directly and walk backwards through the
// preceding DOM to find the nearest h3 (typically a dose variant like
// "1 dose") to attach as variant.
function extractDrops($) {
  const drops = [];
  $('table.item-drops').each((_, table) => {
    const $t = $(table);

    // Walk previous siblings (and their parents' previous siblings) up to
    // the closest h2/h3 to capture variant. The wiki appends mw-editsection
    // spans after headings, which is why next-sibling traversal fails; the
    // headings themselves are usually a few nodes earlier in document order.
    let variant = null;
    let $prev = $t.prev();
    while ($prev.length) {
      const tag = ($prev.prop('tagName') || '').toLowerCase();
      if (tag === 'h2') break;
      if (tag === 'h3') {
        const text = $prev.find('.mw-headline').text().trim() || $prev.text().trim();
        if (text && !/sources?|drops?|locations?/i.test(text)) variant = text;
        break;
      }
      $prev = $prev.prev();
    }

    $t.find('tbody > tr').each((_, tr) => {
      const $tr = $(tr);
      // Skip header-only rows
      if (!$tr.children('td').length) return;
      const $cells = $tr.children('td');
      if ($cells.length < 4) return;

      const qtyText = $cells.eq(2).text().trim();
      const qtyRange = qtyText.match(/(\d+)\s*[-–]\s*(\d+)/);
      const qtySingle = qtyText.match(/^\d+/);

      const source_name = $cells.eq(0).find('a').first().text().trim() || $cells.eq(0).text().trim();
      if (!source_name) return;

      drops.push({
        source_name,
        source_level: parseInt0($cells.eq(1).text()),
        quantity_min: qtyRange ? parseInt(qtyRange[1], 10) : (qtySingle ? parseInt(qtySingle[0], 10) : null),
        quantity_max: qtyRange ? parseInt(qtyRange[2], 10) : (qtySingle ? parseInt(qtySingle[0], 10) : null),
        noted: /noted/i.test(qtyText),
        rarity_text: $cells.eq(3).text().trim(),
        rarity_chance: parseRarityFraction($cells.eq(3).text()),
        variant,
      });
    });
  });
  return drops;
}

// Shop locations — find a wikitable whose header signature matches
// "Seller / Location / ... in stock / Price sold at / Price bought at".
// More robust than walking heading siblings (the wiki uses mw-editsection
// spans that disrupt next-sibling traversal).
function extractShops($) {
  const shops = [];
  $('table.wikitable').each((_, table) => {
    const $t = $(table);
    const $headerCells = $t.find('tr').first().children('th');
    if ($headerCells.length < 5) return;
    const headerText = $headerCells.map((_, th) => $(th).text().toLowerCase().trim()).get().join('|');
    const looksLikeShop = headerText.includes('seller') &&
      headerText.includes('location') &&
      (headerText.includes('stock') || headerText.includes('number'));
    if (!looksLikeShop) return;

    // Build column map from headers (may have whitespace + nested text)
    const headers = $headerCells.map((_, th) => $(th).text().replace(/\s+/g, ' ').toLowerCase().trim()).get();
    const col = (needle) => headers.findIndex(h => h.includes(needle));
    const idxSeller = col('seller');
    const idxLocation = col('location');
    const idxStock = col('stock');
    const idxSold = col('sold');
    const idxBought = col('bought');
    const idxMembers = col('member');

    $t.find('tbody > tr').each((_, tr) => {
      const $tr = $(tr);
      const $cells = $tr.children('td');
      if (!$cells.length) return;

      const sellerCell = $cells.eq(idxSeller).text().replace(/\s+/g, ' ').trim();
      const sellerName = $cells.eq(idxSeller).find('a').first().text().trim() || sellerCell;
      if (!sellerName) return;
      const requirementsMatch = sellerCell.match(/(\d+\s*to\s*\d+\s*reputation|\d+\+\s*reputation)/i);

      shops.push({
        seller_name: sellerName,
        requirements: requirementsMatch ? requirementsMatch[1] : null,
        location: idxLocation >= 0 ? $cells.eq(idxLocation).text().trim() || null : null,
        stock: idxStock >= 0 ? parseInt0($cells.eq(idxStock).text()) : null,
        sold_price: idxSold >= 0 ? parseInt0($cells.eq(idxSold).text()) : null,
        bought_price: idxBought >= 0 ? parseInt0($cells.eq(idxBought).text()) : null,
        members_only: idxMembers >= 0
          ? (() => {
              const alt = $cells.eq(idxMembers).find('img').attr('alt');
              return alt ? /member/i.test(alt) : null;
            })()
          : null,
      });
    });
  });
  return shops;
}

// For multi-dose items, the wiki's switch infobox defaults to the 1-dose
// image even on the canonical/dose-less page (e.g. "Super restore" shows
// the (1) image). Substitute the URL to point at the (4) variant when the
// canonical page lacks a dose suffix — the wiki's filename convention is
// consistent so URL substitution is safe.
function prefer4DoseImage({ pageTitle, imageUrl }) {
  if (!imageUrl) return imageUrl;
  if (/\([1-4]\)$/.test(pageTitle)) return imageUrl; // dose-specific page, keep as-is
  return imageUrl.replace(/%28[1-3]%29/g, '%284%29');
}

async function fetchItem(pageTitle) {
  const { title, html, sections, categories } = await fetchParsedPage(pageTitle);
  const $ = cheerio.load(html);

  const infobox = extractInfobox($);
  if (infobox) {
    infobox.image_url = prefer4DoseImage({ pageTitle: title, imageUrl: infobox.image_url });
  }
  const recipes = extractRecipes($);
  const products = extractProducts($);
  const disassembly = extractDisassembly($);
  const drops = extractDrops($);
  const shops = extractShops($);

  const description = $('.mw-parser-output > p').first().text().replace(/\s+/g, ' ').trim() || null;

  return {
    wiki_page_title: title,
    slug: slugify(title),
    name: title,
    description,
    categories,
    infobox,
    recipes,
    products,
    disassembly,
    drops,
    shops,
    sections: sections?.map(s => ({ index: s.index, line: s.line, level: s.level })) || [],
  };
}

module.exports = {
  fetchItem,
  slugify,
  listCategoryMembers,
  _internal: { fetchParsedPage, extractInfobox, extractRecipes, extractProducts, extractDisassembly, extractDrops, extractShops },
};
