// Wiki sync — pulls structured entity data from runescape.wiki.
//
// The wiki does NOT have Semantic MediaWiki or Cargo installed, so there's
// no JSON-typed structured-query API. We have to:
//   1. List category members via action=query&list=categorymembers
//   2. For each page, fetch action=parse&prop=text (rendered HTML)
//   3. Parse the rsw-infobox table with cheerio, mapping row labels to
//      typed fields per entity type.
//
// Slow but reliable. ~1.1s per page (polite throttle) so a 20-page sample
// per type → ~25 sec for the full sandbox sync.
const axios = require('axios');
const cheerio = require('cheerio');
const {
  Creature, NPC, Achievement, WikiLocation, ResourceNode, WikiSyncLog,
} = require('../models');
const logger = require('../utils/logger');

const USER_AGENT = 'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)';
const http = axios.create({
  baseURL: 'https://runescape.wiki',
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  timeout: 30000,
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// List page titles in a category, namespace-0 (real pages) only.
// `filter` is an optional predicate to drop meta pages / subcategory headers.
async function listCategoryMembers(category, { limit = 20, filter = null } = {}) {
  const all = [];
  let cmcontinue = null;
  while (all.length < limit) {
    const params = {
      action: 'query', list: 'categorymembers',
      cmtitle: 'Category:' + category, cmlimit: Math.min(500, limit * 3),
      cmnamespace: 0, format: 'json',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    const res = await http.get('/api.php', { params });
    for (const m of res.data?.query?.categorymembers || []) {
      const title = m.title;
      if (filter && !filter(title)) continue;
      // Drop top-level meta pages whose title equals the category root
      if (title === category || title === category.replace(/s$/, '')) continue;
      all.push(title);
      if (all.length >= limit) break;
    }
    cmcontinue = res.data?.continue?.cmcontinue;
    if (!cmcontinue) break;
  }
  return all;
}

// Fetch a page's HTML via the parse API and return a cheerio root.
async function fetchPage(title) {
  const res = await http.get('/api.php', {
    params: { action: 'parse', page: title, format: 'json', prop: 'text', redirects: 1 },
  });
  if (res.data?.error) throw new Error(`parse error: ${res.data.error.info}`);
  return cheerio.load(res.data.parse.text['*']);
}

// Pull rsw-infobox rows into a label→value map, lowercased labels.
// We use data-attr-param when available (the wiki annotates many fields).
function parseInfobox($) {
  const fields = {};
  const $infobox = $('table.rsw-infobox').first();
  if (!$infobox.length) return fields;

  // Two passes: (1) data-attr-param annotations, (2) plain th/td rows
  $infobox.find('[data-attr-param]').each((_, el) => {
    const key = $(el).attr('data-attr-param');
    const val = $(el).text().replace(/\s+/g, ' ').trim();
    if (key && val) fields[key.toLowerCase()] = val;
  });

  $infobox.find('tr').each((_, tr) => {
    const $tr = $(tr);
    const label = $tr.find('th').first().text().replace(/\s+/g, ' ').trim().toLowerCase();
    const value = $tr.find('td').first().text().replace(/\s+/g, ' ').trim();
    if (label && value && !fields[label]) fields[label] = value;
  });

  return fields;
}

// Parse "Lifepoints" → 1500, "12,000" → 12000, "98 / 99" → 98 (first number)
function parseInt0(v) {
  if (v == null) return null;
  const m = String(v).match(/-?\d[\d,]*/);
  if (!m) return null;
  const n = parseInt(m[0].replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}
function parseFloat0(v) {
  if (v == null) return null;
  const m = String(v).match(/-?\d[\d,]*(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
function parseBool(v) {
  if (v == null) return null;
  const s = String(v).toLowerCase().trim();
  if (/^(yes|y|true|t|members)$/.test(s)) return true;
  if (/^(no|n|false|f|free|f2p)$/.test(s)) return false;
  return null;
}

// Strip the leading "examine" prose if it leaked in
function cleanExamine(v) {
  if (!v) return null;
  return String(v).replace(/^(examine|examine text)\s*[:.]?\s*/i, '').trim() || null;
}

const sourceUrl = (title) => 'https://runescape.wiki/w/' + encodeURIComponent(title.replace(/\s/g, '_'));

// ---------- per-type fetchers ----------

async function syncCreatures(limit = 20) {
  const titles = await listCategoryMembers('Bestiary', {
    limit,
    // Drop achievement/meta pages that occasionally sit in Bestiary
    filter: t => !/^Bestiary$/i.test(t) && !/achievement|guide/i.test(t),
  });
  let created = 0, updated = 0, failed = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    try {
      const $ = await fetchPage(title);
      const f = parseInfobox($);
      const row = {
        slug: slugify(title),
        name: title,
        combat_level:      parseInt0(f['combat level'] || f['combat_level']),
        slayer_level:      parseInt0(f['slayer level'] || f['slayer_level']),
        slayer_experience: parseFloat0(f['slayer experience'] || f['slayer_experience'] || f['slayer xp']),
        lifepoints:        parseInt0(f['lifepoints'] || f['life points']),
        aggressive:        parseBool(f['aggressive']),
        poisonous:         parseBool(f['poisonous']),
        members:           parseBool(f['members']),
        examine:           cleanExamine(f['examine']),
        data: f,
        source_url: sourceUrl(title),
      };
      const [, isNew] = await Creature.upsert(row);
      if (isNew) created++; else updated++;
    } catch (err) { failed++; logger.warn('Creature parse failed', { title, message: err.message }); }
    if (i < titles.length - 1) await sleep(1100);
  }
  await WikiSyncLog.create({ entity_type: 'creatures', fetched: titles.length, created, updated, failed });
  return { fetched: titles.length, created, updated, failed };
}

async function syncNPCs(limit = 20) {
  const titles = await listCategoryMembers('Non-player characters', {
    limit,
    filter: t => !/^Non-player character/i.test(t),
  });
  let created = 0, updated = 0, failed = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    try {
      const $ = await fetchPage(title);
      const f = parseInfobox($);
      const row = {
        slug: slugify(title),
        name: title,
        examine:  cleanExamine(f['examine']),
        location: f['location'] || null,
        role:     f['role'] || f['occupation'] || null,
        members:  parseBool(f['members']),
        data: f,
        source_url: sourceUrl(title),
      };
      const [, isNew] = await NPC.upsert(row);
      if (isNew) created++; else updated++;
    } catch (err) { failed++; logger.warn('NPC parse failed', { title, message: err.message }); }
    if (i < titles.length - 1) await sleep(1100);
  }
  await WikiSyncLog.create({ entity_type: 'npcs', fetched: titles.length, created, updated, failed });
  return { fetched: titles.length, created, updated, failed };
}

async function syncAchievements(limit = 20) {
  // The root Achievements category mostly lists subcategory hub pages.
  // Drop pages whose title contains "achievements" so we only keep the
  // leaf "achievement" entries.
  const titles = await listCategoryMembers('Achievements', {
    limit,
    filter: t => !/^Achievements$/i.test(t) && !/\sachievements$/i.test(t),
  });
  let created = 0, updated = 0, failed = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    try {
      const $ = await fetchPage(title);
      const f = parseInfobox($);
      const row = {
        slug: slugify(title),
        name: title,
        category:    f['category'] || null,
        subcategory: f['subcategory'] || null,
        difficulty:  f['difficulty'] || null,
        description: f['description'] || null,
        members:     parseBool(f['members']),
        data: f,
        source_url: sourceUrl(title),
      };
      const [, isNew] = await Achievement.upsert(row);
      if (isNew) created++; else updated++;
    } catch (err) { failed++; logger.warn('Achievement parse failed', { title, message: err.message }); }
    if (i < titles.length - 1) await sleep(1100);
  }
  await WikiSyncLog.create({ entity_type: 'achievements', fetched: titles.length, created, updated, failed });
  return { fetched: titles.length, created, updated, failed };
}

async function syncLocations(limit = 20) {
  const titles = await listCategoryMembers('Locations', {
    limit,
    filter: t => !/^Locations?$/i.test(t),
  });
  let created = 0, updated = 0, failed = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    try {
      const $ = await fetchPage(title);
      const f = parseInfobox($);
      const row = {
        slug: slugify(title),
        name: title,
        type:    f['type'] || null,
        region:  f['region'] || f['kingdom'] || null,
        members: parseBool(f['members']),
        data: f,
        source_url: sourceUrl(title),
      };
      const [, isNew] = await WikiLocation.upsert(row);
      if (isNew) created++; else updated++;
    } catch (err) { failed++; logger.warn('Location parse failed', { title, message: err.message }); }
    if (i < titles.length - 1) await sleep(1100);
  }
  await WikiSyncLog.create({ entity_type: 'locations', fetched: titles.length, created, updated, failed });
  return { fetched: titles.length, created, updated, failed };
}

// Resource nodes — 3 categories, one combined table. Farming patches
// category seems empty / different name on the wiki; skip for now.
const NODE_SPECS = [
  { type: 'tree',         skill: 'Woodcutting', category: 'Trees',
    fields: { level: 'woodcutting level', xp: 'woodcutting experience', yields: 'logs' } },
  { type: 'rock',         skill: 'Mining',      category: 'Rocks',
    fields: { level: 'mining level', xp: 'mining experience', yields: 'ore' } },
  { type: 'fishing_spot', skill: 'Fishing',     category: 'Fishing spots',
    fields: { level: 'fishing level', xp: 'fishing experience', yields: 'fish' } },
];

async function syncResourceNodes(limitPerType = 20) {
  let created = 0, updated = 0, failed = 0, fetched = 0;
  for (const spec of NODE_SPECS) {
    let titles = [];
    try {
      titles = await listCategoryMembers(spec.category, {
        limit: limitPerType,
        filter: t => !new RegExp('^' + spec.category + '?$', 'i').test(t),
      });
    } catch (err) { logger.warn('Resource node list failed', { type: spec.type, message: err.message }); continue; }
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      try {
        const $ = await fetchPage(title);
        const f = parseInfobox($);
        const row = {
          slug: `${spec.type}-${slugify(title)}`,
          name: title,
          node_type: spec.type,
          skill: spec.skill,
          level: parseInt0(f[spec.fields.level]),
          xp:    parseFloat0(f[spec.fields.xp]),
          yields: f[spec.fields.yields] || null,
          location: f['location'] || null,
          members: parseBool(f['members']),
          data: f,
          source_url: sourceUrl(title),
        };
        const [, isNew] = await ResourceNode.upsert(row);
        if (isNew) created++; else updated++;
        fetched++;
      } catch (err) { failed++; logger.warn('ResourceNode parse failed', { title, message: err.message }); }
      if (i < titles.length - 1) await sleep(1100);
    }
    await sleep(800); // brief pause between node categories
  }
  await WikiSyncLog.create({ entity_type: 'resource_nodes', fetched, created, updated, failed });
  return { fetched, created, updated, failed };
}

async function syncAll(limit = 20) {
  const results = {};
  for (const [name, fn] of [
    ['creatures',      () => syncCreatures(limit)],
    ['npcs',           () => syncNPCs(limit)],
    ['achievements',   () => syncAchievements(limit)],
    ['locations',      () => syncLocations(limit)],
    ['resource_nodes', () => syncResourceNodes(limit)],
  ]) {
    try {
      results[name] = await fn();
    } catch (err) {
      logger.error('Wiki sync failed', err, { entity_type: name });
      results[name] = { error: err.message };
      await WikiSyncLog.create({ entity_type: name, status: 'error', notes: err.message });
    }
  }
  return results;
}

module.exports = {
  syncCreatures, syncNPCs, syncAchievements, syncLocations, syncResourceNodes, syncAll,
};
