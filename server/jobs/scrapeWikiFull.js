// Full wiki seed — pulls every page from each tracked category and writes
// to its respective table. Resumable: skips slugs that already exist in
// the DB, so re-running picks up where the last invocation left off.
//
// Usage:
//   node server/jobs/scrapeWikiFull.js              # default (1.1s throttle)
//   WIKI_THROTTLE_MS=500 node server/jobs/scrapeWikiFull.js   # faster
//   WIKI_TYPES=creatures,locations node ...         # only specific types
//
// Ctrl+C is safe at any point. Re-running continues from the next unseen
// page.
const path = require('path');
// Load .env from server/ regardless of where the script was invoked from.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const axios = require('axios');
const cheerio = require('cheerio');
const {
  Creature, NPC, Achievement, WikiLocation, ResourceNode, WikiSyncLog,
} = require('../models');

const USER_AGENT = 'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)';
const http = axios.create({
  baseURL: 'https://runescape.wiki',
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  timeout: 30000,
});

const THROTTLE_MS = parseInt(process.env.WIKI_THROTTLE_MS || '1100', 10);
const ONLY_TYPES = (process.env.WIKI_TYPES || '').split(',').map(s => s.trim()).filter(Boolean);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let interrupted = false;
process.on('SIGINT', () => {
  if (interrupted) process.exit(1);
  interrupted = true;
  console.log('\n  ! Interrupt received — finishing current page then exiting cleanly. Press Ctrl+C again to force.');
});

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const sourceUrl = (title) => 'https://runescape.wiki/w/' + encodeURIComponent(title.replace(/\s/g, '_'));

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
function cleanExamine(v) {
  if (!v) return null;
  return String(v).replace(/^(examine|examine text)\s*[:.]?\s*/i, '').trim() || null;
}

async function listAllCategoryMembers(category, filter) {
  const all = [];
  let cmcontinue = null;
  while (true) {
    const params = {
      action: 'query', list: 'categorymembers',
      cmtitle: 'Category:' + category, cmlimit: 500,
      cmnamespace: 0, format: 'json',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    const res = await http.get('/api.php', { params });
    for (const m of res.data?.query?.categorymembers || []) {
      if (filter && !filter(m.title)) continue;
      all.push(m.title);
    }
    cmcontinue = res.data?.continue?.cmcontinue;
    if (!cmcontinue) break;
  }
  return all;
}

async function fetchPage(title) {
  const res = await http.get('/api.php', {
    params: { action: 'parse', page: title, format: 'json', prop: 'text', redirects: 1 },
  });
  if (res.data?.error) throw new Error(res.data.error.info);
  return cheerio.load(res.data.parse.text['*']);
}

function parseInfobox($) {
  const fields = {};
  const $infobox = $('table.rsw-infobox').first();
  if (!$infobox.length) return fields;
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

// ---------- Generic per-type processor with resume + progress ----------
async function processType({ entityType, category, filter, Model, slugFn, build }) {
  if (ONLY_TYPES.length > 0 && !ONLY_TYPES.includes(entityType.split(' ')[0])) {
    console.log(`\n--- ${entityType} (skipped — not in WIKI_TYPES) ---`);
    return;
  }

  const start = Date.now();
  console.log(`\n--- ${entityType} ---`);

  console.log('  Listing all category members…');
  let allTitles;
  try {
    allTitles = await listAllCategoryMembers(category, filter);
  } catch (err) {
    console.log('  ! Category listing failed:', err.message);
    return;
  }
  console.log(`  ${allTitles.length} total titles in Category:${category}`);

  // Resume: skip titles whose slug is already in DB
  const existing = await Model.findAll({ attributes: ['slug'] });
  const existingSlugs = new Set(existing.map(r => r.slug));
  const toFetch = allTitles.filter(t => !existingSlugs.has(slugFn ? slugFn(t) : slugify(t)));
  console.log(`  ${existingSlugs.size} already seeded · ${toFetch.length} to fetch`);

  if (toFetch.length === 0) {
    console.log('  Nothing to do.');
    return;
  }

  const estMin = (toFetch.length * THROTTLE_MS / 60000).toFixed(1);
  console.log(`  Estimated: ${estMin} min at ${THROTTLE_MS}ms/req\n`);

  let created = 0, updated = 0, failed = 0;
  for (let i = 0; i < toFetch.length; i++) {
    if (interrupted) {
      console.log(`  Stopped early at ${i}/${toFetch.length}`);
      break;
    }
    const title = toFetch[i];
    try {
      const $ = await fetchPage(title);
      const fields = parseInfobox($);
      const row = build(title, fields);
      const [, isNew] = await Model.upsert(row);
      if (isNew) created++; else updated++;
    } catch (err) {
      failed++;
      if (failed <= 5 || failed % 100 === 0) {
        console.log(`  ! ${title}: ${err.message}`);
      }
    }

    // Progress every 25
    if ((i + 1) % 25 === 0 || i === toFetch.length - 1) {
      const elapsed = (Date.now() - start) / 1000;
      const rate = (i + 1) / elapsed;
      const eta = Math.max(0, (toFetch.length - i - 1) / rate);
      console.log(`  ${i + 1}/${toFetch.length} (${((i + 1) / toFetch.length * 100).toFixed(1)}%) · ${rate.toFixed(2)} req/sec · ETA ${(eta / 60).toFixed(1)} min · failed ${failed}`);
    }

    await sleep(THROTTLE_MS);
  }

  const totalMin = ((Date.now() - start) / 60000).toFixed(1);
  console.log(`  ✓ ${entityType} done in ${totalMin} min — created ${created}, updated ${updated}, failed ${failed}`);

  await WikiSyncLog.create({
    entity_type: entityType,
    fetched: created + updated + failed,
    created, updated, failed,
    notes: `Full seed (${totalMin} min, throttle ${THROTTLE_MS}ms)`,
  });
}

// ---------- main ----------
async function main() {
  console.log('============================================');
  console.log('  Full wiki seed');
  console.log('  Throttle:', THROTTLE_MS, 'ms/req');
  console.log('  Types filter:', ONLY_TYPES.length ? ONLY_TYPES.join(', ') : 'all');
  console.log('  Resumable: skips slugs already in DB');
  console.log('  Interrupt: Ctrl+C anytime, re-run to continue');
  console.log('============================================');

  const startAll = Date.now();

  await processType({
    entityType: 'creatures',
    category: 'Bestiary',
    filter: t => !/^Bestiary$/i.test(t) && !/achievement|guide/i.test(t),
    Model: Creature,
    build: (title, f) => ({
      slug: slugify(title),
      name: title,
      combat_level:      parseInt0(f['combat level']),
      slayer_level:      parseInt0(f['slayer level']),
      slayer_experience: parseFloat0(f['slayer experience'] || f['slayer xp']),
      lifepoints:        parseInt0(f['lifepoints']),
      aggressive:        parseBool(f['aggressive']),
      poisonous:         parseBool(f['poisonous']),
      members:           parseBool(f['members']),
      examine:           cleanExamine(f['examine']),
      data: f,
      source_url: sourceUrl(title),
    }),
  });

  if (interrupted) return finish(startAll);

  await processType({
    entityType: 'npcs',
    category: 'Non-player characters',
    filter: t => !/^Non-player character/i.test(t),
    Model: NPC,
    build: (title, f) => ({
      slug: slugify(title),
      name: title,
      examine:  cleanExamine(f['examine']),
      location: f['location'] || null,
      role:     f['role'] || f['occupation'] || null,
      members:  parseBool(f['members']),
      data: f,
      source_url: sourceUrl(title),
    }),
  });

  if (interrupted) return finish(startAll);

  await processType({
    entityType: 'achievements',
    category: 'Achievements',
    filter: t => !/^Achievements$/i.test(t) && !/\sachievements$/i.test(t),
    Model: Achievement,
    build: (title, f) => ({
      slug: slugify(title),
      name: title,
      category:    f['category'] || null,
      subcategory: f['subcategory'] || null,
      difficulty:  f['difficulty'] || null,
      description: f['description'] || null,
      members:     parseBool(f['members']),
      data: f,
      source_url: sourceUrl(title),
    }),
  });

  if (interrupted) return finish(startAll);

  await processType({
    entityType: 'locations',
    category: 'Locations',
    filter: t => !/^Locations?$/i.test(t),
    Model: WikiLocation,
    build: (title, f) => ({
      slug: slugify(title),
      name: title,
      type:    f['type'] || null,
      region:  f['region'] || f['kingdom'] || null,
      members: parseBool(f['members']),
      data: f,
      source_url: sourceUrl(title),
    }),
  });

  if (interrupted) return finish(startAll);

  // Resource nodes — three categories, one combined table.
  const NODE_SPECS = [
    { type: 'tree',         skill: 'Woodcutting', category: 'Trees',
      fields: { level: 'woodcutting level', xp: 'woodcutting experience', yields: 'logs' } },
    { type: 'rock',         skill: 'Mining',      category: 'Rocks',
      fields: { level: 'mining level', xp: 'mining experience', yields: 'ore' } },
    { type: 'fishing_spot', skill: 'Fishing',     category: 'Fishing spots',
      fields: { level: 'fishing level', xp: 'fishing experience', yields: 'fish' } },
  ];
  for (const spec of NODE_SPECS) {
    if (interrupted) break;
    await processType({
      entityType: `resource_nodes (${spec.type})`,
      category: spec.category,
      filter: t => !new RegExp('^' + spec.category + '?$', 'i').test(t),
      Model: ResourceNode,
      slugFn: t => `${spec.type}-${slugify(t)}`,
      build: (title, f) => ({
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
      }),
    });
  }

  finish(startAll);
}

function finish(startAll) {
  const totalMin = ((Date.now() - startAll) / 60000).toFixed(1);
  console.log(`\n============================================`);
  console.log(`  ${interrupted ? 'Interrupted' : 'Complete'} after ${totalMin} min`);
  console.log(`  Re-run the script anytime to resume.`);
  console.log(`============================================`);
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
