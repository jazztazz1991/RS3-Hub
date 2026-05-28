// Lazy section-hydration for wiki entities.
//
// Our initial seed (wikiSync / scrapeWikiFull) only captures the infobox
// fields. The same fetched HTML also contains the lead paragraph and
// every named section (Location, Strategies, History, etc.) — we just
// weren't parsing them. This service re-fetches the page once on demand,
// extracts those sections, and updates the row's `data` JSONB blob with
// a `_sections` and `_lead` payload.
//
// The detail GET endpoints call hydrateRow() if the row hasn't been
// hydrated yet, so a single user visit fills in the data permanently.
const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)';
const http = axios.create({
  baseURL: 'https://runescape.wiki',
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  timeout: 20000,
});

// Sections we care about. Heading text on the wiki is case-sensitive but
// we lowercase for matching. Per-entity-type relevance:
//   creatures: Location, Strategies, History, Lore
//   npcs:      Location, History, Lore
//   locations: Description, History, Geography
//   achievements: Description, Requirements, Rewards
const KNOWN_SECTIONS = [
  'location', 'strategy', 'strategies', 'description', 'history', 'lore',
  'about', 'background', 'requirements', 'rewards', 'reward',
  'geography', 'overview', 'features', 'mechanics',
];

async function fetchPageHtml(title) {
  const res = await http.get('/api.php', {
    params: { action: 'parse', page: title, format: 'json', prop: 'text', redirects: 1 },
  });
  if (res.data?.error) throw new Error(res.data.error.info);
  return res.data.parse.text['*'];
}

// Lead = the first <p> in the parser output before any h2/h3.
function extractLead($) {
  const $p = $('.mw-parser-output p').first();
  if (!$p.length) return null;
  const text = $p.text().replace(/\s+/g, ' ').trim();
  if (!text || text.length < 30) return null;
  return text;
}

// For each h2/h3 we recognise, capture the text content under it (until
// the next h2/h3). Returns { 'Location': '...', 'Strategies': '...', ... }
// Inline images, navboxes, and edit-section links are stripped.
function extractSections($) {
  const sections = {};
  $('h2, h3').each((_, el) => {
    const $h = $(el);
    const rawHeading = $h.find('.mw-headline').text().trim() || $h.text().replace(/\[edit\]/g, '').trim();
    if (!rawHeading) return;
    const key = rawHeading.toLowerCase();
    if (!KNOWN_SECTIONS.some(k => key === k || key.startsWith(k + ' ') || key.endsWith(' ' + k))) return;

    // Walk siblings until next heading. Skip navboxes and tables.
    const parts = [];
    let $cur = $h.next();
    while ($cur.length && !$cur.is('h2, h3')) {
      const tag = ($cur.prop('tagName') || '').toLowerCase();
      if (tag === 'p' || tag === 'ul' || tag === 'ol') {
        // Strip [edit] artifacts and reference superscripts
        $cur.find('.mw-editsection, sup.reference, .navbox, .navbar').remove();
        const t = $cur.text().replace(/\s+/g, ' ').trim();
        if (t) parts.push(t);
      }
      $cur = $cur.next();
    }
    const text = parts.join('\n\n').trim();
    if (text) sections[rawHeading] = text;
  });
  return sections;
}

// Apply hydration to a Sequelize row instance. Returns the updated row.
// Idempotent: if data._sections already exists, returns immediately.
async function hydrateRow(row) {
  if (!row || !row.name) return row;
  if (row.data?._sections_hydrated) return row;

  try {
    const html = await fetchPageHtml(row.name);
    const $ = cheerio.load(html);
    const lead = extractLead($);
    const sections = extractSections($);

    const newData = { ...(row.data || {}) };
    newData._lead = lead;
    newData._sections = sections;
    newData._sections_hydrated = true;
    newData._sections_hydrated_at = new Date().toISOString();

    row.data = newData;
    // Sequelize JSONB column needs explicit marking when we mutate the object reference
    row.changed('data', true);
    await row.save();
    return row;
  } catch (err) {
    // Mark hydration attempted so we don't keep retrying on every view
    const newData = { ...(row.data || {}), _sections_hydrated: true, _sections_error: err.message };
    row.data = newData;
    row.changed('data', true);
    await row.save();
    return row;
  }
}

module.exports = { hydrateRow, extractLead, extractSections, fetchPageHtml };
