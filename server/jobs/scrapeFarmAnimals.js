// One-shot scraper: pull all PoF animal pages from the wiki, extract their
// growth-stage tables, and write a complete farmAnimals.json file.
//
// Usage:  node server/jobs/scrapeFarmAnimals.js
//
// Why one-shot rather than a cron: animal data is essentially static (a
// Jagex patch is the only thing that changes it), so running this on
// demand when we want to refresh the catalogue is fine.
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const OUT_PATH = path.resolve(__dirname, '..', 'data', 'farmAnimals.json');
const USER_AGENT = 'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)';

const http = axios.create({
  baseURL: 'https://runescape.wiki',
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  timeout: 30000,
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Convert wiki time strings like "1h 12m", "1d 6h 14m", "25m" into minutes.
function parseDuration(text) {
  if (!text) return null;
  const s = String(text).trim();
  if (/^N\/?A$/i.test(s)) return 0;
  let total = 0;
  const dayMatch = s.match(/(\d+)\s*d/);
  const hourMatch = s.match(/(\d+)\s*h/);
  const minMatch = s.match(/(\d+)\s*m/);
  if (dayMatch) total += parseInt(dayMatch[1], 10) * 24 * 60;
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) total += parseInt(minMatch[1], 10);
  return total > 0 ? total : (s === '0' ? 0 : null);
}

// Slugify a page title into a stable id, e.g. "Cow (Player-owned farm)" → "pof-cow"
function slugify(title) {
  const base = title.replace(/\s*\(.+\)\s*$/, '').trim();
  return 'pof-' + base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function listAnimalTitles() {
  // Pull category members, then filter to "<X> (Player-owned farm)" pages
  const all = [];
  let cmcontinue = null;
  while (true) {
    const params = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: 'Category:Player-owned_farm',
      cmlimit: 500,
      cmnamespace: 0,
      format: 'json',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    const res = await http.get('/api.php', { params });
    for (const m of res.data?.query?.categorymembers || []) all.push(m.title);
    cmcontinue = res.data?.continue?.cmcontinue;
    if (!cmcontinue) break;
  }
  // Keep only "X (player-owned farm)" — the wiki uses lowercase "p".
  // Drop teasers, unchecked variants, and egg items.
  return all.filter(t =>
    /\(player-owned farm\)$/i.test(t) &&
    !/\(unchecked\)/i.test(t) &&
    !/teaser/i.test(t) &&
    !/\segg\s\(/i.test(t)
  );
}

// Parse one animal page, returning a record matching farmAnimals.json shape.
async function parseAnimal(title) {
  const res = await http.get('/api.php', {
    params: { action: 'parse', page: title, format: 'json', prop: 'text', redirects: 1 },
  });
  if (res.data?.error) throw new Error(`parse error: ${res.data.error.info}`);
  const $ = cheerio.load(res.data.parse.text['*']);

  // Growth table: first row is stage names, second row "Growth time | N/A | 1h 12m | ..."
  let stageNames = null;
  let stageTimes = null;
  $('table').each((_, t) => {
    if (stageTimes) return;
    const $t = $(t);
    const rows = $t.find('tr');
    if (rows.length < 2) return;
    const firstCells = rows.first().children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
    if (!firstCells.some(s => /Adolescent|Adult|Elder/i.test(s))) return;
    const growth = rows.filter((_, tr) => /growth time/i.test($(tr).text())).first();
    if (!growth.length) return;
    stageNames = firstCells.slice(1); // drop the leading "Single stage" cell
    stageTimes = growth.children().slice(1).map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
  });
  if (!stageNames || !stageTimes) return null;

  // Build growth_stages with cumulative minutes_from_start.
  const stages = [];
  let cumulative = 0;
  for (let i = 0; i < stageNames.length; i++) {
    const min = parseDuration(stageTimes[i]);
    if (min == null) continue;
    cumulative += min;
    stages.push({ stage: stageNames[i], minutes_from_start: cumulative });
  }
  if (!stages.length) return null;

  // Infobox metadata. Wiki uses table.rsw-infobox (not table.infobox).
  let pen_type = null, farming_level = null;
  $('table.rsw-infobox').first().find('tr').each((_, tr) => {
    const $tr = $(tr);
    const label = $tr.find('th').first().text().replace(/\s+/g, ' ').trim().toLowerCase();
    const value = $tr.find('td').first().text().replace(/\s+/g, ' ').trim();
    if (!label || !value) return;
    if (label === 'pen size' || label.includes('pen')) pen_type = value;
    if (label === 'level' && /\d/.test(value)) {
      const m = value.match(/\d+/);
      if (m) farming_level = parseInt(m[0], 10);
    }
  });

  // Animal image (first <img> inside the infobox)
  let image_url = null;
  const $img = $('table.rsw-infobox img').first();
  if ($img.length) {
    let src = $img.attr('src');
    if (src && src.startsWith('/')) src = 'https://runescape.wiki' + src;
    image_url = src || null;
  }

  return {
    slug: slugify(title),
    kind: 'pof',
    name: title.replace(/\s*\(player-owned farm\)\s*$/i, '').trim(),
    image_url,
    pen_type,
    farming_level,
    growth_stages: stages,
    source_url: `https://runescape.wiki/w/${encodeURIComponent(title.replace(/\s/g, '_'))}`,
  };
}

// Build a Map of species name → { farming_level, pen_size } from the
// Anachronia Dinosaur Farm overview page. We don't emit standalone entries
// from this (per-species wiki pages give more accurate growth times); we
// just use it to retag PoF entries as kind='dino' and merge in level/pen.
async function scrapeDinoSpeciesMap() {
  const res = await http.get('/api.php', {
    params: { action: 'parse', page: 'Anachronia Dinosaur Farm', format: 'json', prop: 'text', redirects: 1 },
  });
  const $ = cheerio.load(res.data.parse.text['*']);
  const speciesMap = new Map();
  // Only target the species/pen table — must have BOTH "Farming Level" and
  // "Pen" headers (skips the growth-stage table which also has Farming Level).
  let $table = null;
  $('table').each((_, t) => {
    if ($table) return;
    const headers = $(t).find('tr').first().children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
    if (headers.some(h => /Farming Level/i.test(h)) && headers.some(h => /Pen/i.test(h))) $table = $(t);
  });
  if (!$table) return speciesMap;
  let currentPenSize = null;
  $table.find('tr').each((_, tr) => {
    const cells = $(tr).children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
    if (cells.length < 2) return;
    if (/^(Small|Medium|Large)$/i.test(cells[0])) { currentPenSize = cells[0]; cells.shift(); }
    const name = cells[0];
    const lvlText = cells[1];
    // Strict: only accept pure-digit cells in farming level range. Breed
    // continuation rows have prices like "1,706,962" in this column.
    if (!/^\d{1,3}$/.test(lvlText)) return;
    const level = parseInt(lvlText, 10);
    if (level < 1 || level > 120) return;
    speciesMap.set(name, { farming_level: level, pen_size: currentPenSize });
  });
  return speciesMap;
}

// Legacy: kept for backwards compat but unused now. Per-species wiki pages
// are scraped via parseAnimal which is more accurate than the overview table.
async function scrapeDinos() {
  const res = await http.get('/api.php', {
    params: { action: 'parse', page: 'Anachronia Dinosaur Farm', format: 'json', prop: 'text', redirects: 1 },
  });
  const $ = cheerio.load(res.data.parse.text['*']);

  // Find the "Time per stage" table (has headers Egg to child / Child to adolescent / ...)
  let $timeTable = null;
  $('table').each((_, t) => {
    if ($timeTable) return;
    const headerRow2 = $(t).find('tr').eq(1).children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
    if (headerRow2.join(' ').toLowerCase().includes('egg to child')) $timeTable = $(t);
  });
  if (!$timeTable) {
    console.log('  (Anachronia farm growth table not found)');
    return [];
  }

  // Find the species-to-farming-level table (header includes "Farming Level")
  // and build a Map of species name → { farming_level, pen_size, family_hint }
  const speciesMap = new Map();
  $('table').each((_, t) => {
    const headers = $(t).find('tr').first().children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
    if (!headers.some(h => /Farming Level/i.test(h))) return;
    let currentPenSize = null;
    $(t).find('tr').slice(2).each((_, tr) => {
      const cells = $(tr).children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
      if (cells.length < 2) return;
      // Pen size sometimes occupies col 0 with rowspan; otherwise it's repeated
      if (/^(Small|Medium|Large)$/i.test(cells[0])) { currentPenSize = cells[0]; cells.shift(); }
      const name = cells[0];
      const level = parseInt(cells[1], 10);
      if (name && Number.isFinite(level)) {
        speciesMap.set(name, { farming_level: level, pen_size: currentPenSize });
      }
    });
  });

  // Build family entries from the time-per-stage table
  const families = [];
  $timeTable.find('tr').slice(2).each((_, tr) => {
    const cells = $(tr).children().map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
    if (cells.length < 5) return;
    const familyName = cells[0];
    const stages = [
      { stage: 'Egg', minutes: 0 },
      { stage: 'Child', minutes: parseDuration(cells[1]) },
      { stage: 'Adolescent', minutes: parseDuration(cells[2]) },
      { stage: 'Adult', minutes: parseDuration(cells[3]) },
      { stage: 'Elder', minutes: parseDuration(cells[4]) },
    ];
    if (stages.slice(1).some(s => s.minutes == null)) return;
    let cumulative = 0;
    const growth = stages.map(s => {
      cumulative += s.minutes || 0;
      return { stage: s.stage, minutes_from_start: cumulative };
    });
    families.push({ name: familyName, growth });
  });

  // Convert families → catalogue rows. For each family, also emit any
  // species in speciesMap whose family hint matches; if no match, emit
  // the family itself as the entry.
  const out = [];
  for (const fam of families) {
    // Try to find species that belong to this family by name match (loose)
    const familyKey = fam.name.toLowerCase().replace(/s$/, '');
    const matchingSpecies = [];
    for (const [sp, info] of speciesMap) {
      if (sp.toLowerCase().includes(familyKey)) matchingSpecies.push({ name: sp, ...info });
    }
    if (matchingSpecies.length === 0) {
      // No species match — emit the family as a single entry
      const cleanName = fam.name.replace(/s$/, '');
      out.push({
        slug: 'dino-' + cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        kind: 'dino',
        name: cleanName,
        image_url: null,
        pen_type: null,
        farming_level: null,
        growth_stages: fam.growth,
        source_url: 'https://runescape.wiki/w/Anachronia_Dinosaur_Farm',
      });
    } else {
      for (const sp of matchingSpecies) {
        out.push({
          slug: 'dino-' + sp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          kind: 'dino',
          name: sp.name,
          image_url: null,
          pen_type: sp.pen_size ? `${sp.pen_size} dino pen` : null,
          farming_level: sp.farming_level,
          growth_stages: fam.growth,
          source_url: `https://runescape.wiki/w/${encodeURIComponent(sp.name.replace(/\s/g, '_'))}`,
        });
      }
    }
  }
  return out;
}

async function main() {
  console.log('=== Building dino species map (Anachronia) ===');
  const speciesMap = await scrapeDinoSpeciesMap();
  console.log(`  ${speciesMap.size} dino species (name → level + pen size)\n`);

  console.log('=== Animal pages ===');
  const pofTitles = await listAnimalTitles();
  console.log(`  ${pofTitles.length} candidate pages\n`);

  const all = [];
  const failed = [];
  for (let i = 0; i < pofTitles.length; i++) {
    const t = pofTitles[i];
    process.stdout.write(`  [${i + 1}/${pofTitles.length}] ${t} ... `);
    try {
      const animal = await parseAnimal(t);
      if (animal) {
        // Detect Anachronia dinos two ways: (1) Anachronia species table
        // lookup (gives level + pen), (2) name pattern fallback for the
        // dinosaur variants that aren't in the canonical species list
        // (Beach/Feral/Forest/Hypnotic/Magnificent/Ripper/Venomous etc.)
        const dinoInfo = speciesMap.get(animal.name);
        const isDinoByName = /\b(dinosaur|apoterrasaur|rex|asciatops|scimitops|malletops|varanusaur)\b/i.test(animal.name);
        if (dinoInfo || isDinoByName) {
          animal.kind = 'dino';
          animal.slug = animal.slug.replace(/^pof-/, 'dino-');
          if (dinoInfo) {
            animal.farming_level = animal.farming_level || dinoInfo.farming_level;
            animal.pen_type = animal.pen_type || (dinoInfo.pen_size ? `${dinoInfo.pen_size} dino pen` : null);
          }
        }
        all.push(animal);
        console.log(animal.kind === 'dino' ? 'ok (→dino)' : 'ok');
      }
      else { failed.push(t); console.log('skip (no growth table)'); }
    } catch (err) {
      failed.push(t);
      console.log('err:', err.message);
    }
    await sleep(1100);
  }

  // Keep only main species. Breed variants (Black dragon, Corpse spider, etc.)
  // share growth times with their parent and would just clutter the dropdown.
  // Cleanly identified by: no farming_level set on the breed wiki pages.
  const mainSpecies = all.filter(a => a.farming_level != null);
  console.log(`\nFiltered out ${all.length - mainSpecies.length} breed variants; kept ${mainSpecies.length} main species`);

  // Sort: pof first then dino, then by level
  mainSpecies.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'pof' ? -1 : 1;
    return (a.farming_level || 0) - (b.farming_level || 0) || a.name.localeCompare(b.name);
  });

  const payload = {
    schema_version: 1,
    notes: 'Auto-scraped from runescape.wiki. Only main species kept — breed variants share growth times with their parent so they would just clutter the timer dropdown. Re-run server/jobs/scrapeFarmAnimals.js to refresh.',
    animals: mainSpecies,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${mainSpecies.length} main-species animals to ${OUT_PATH}`);
  if (failed.length) console.log(`Failed/skipped (PoF): ${failed.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
