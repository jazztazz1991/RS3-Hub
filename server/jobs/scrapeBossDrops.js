// Scrape real boss drop tables (rates + GE prices) from runescape.wiki and
// write client/src/data/bossDrops.json. Boss metadata (kill/clear times,
// encounter type) is curated here since the wiki has no kill-time data.
//
// Usage: node server/jobs/scrapeBossDrops.js
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const OUT = path.resolve(__dirname, '..', '..', 'client', 'src', 'data', 'bossDrops.json');
const http = axios.create({
  baseURL: 'https://runescape.wiki',
  headers: { 'User-Agent': 'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)' },
  timeout: 30000,
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Only keep drops in this rarity band AND at least this valuable (gp).
// MIN_N filters out common supply drops; MAX_N drops the universal
// rare-drop-table meme items (Hazelmere's signet at 1/4.16m etc.) that
// sit on every boss and would dominate the signature pick.
const MIN_N = 80;
const MAX_N = 50_000;
const MIN_VALUE = 500_000;
const MAX_PER_BOSS = 10;

// Universal rare-drop-table / shared items that aren't a boss's own chase.
const BLOCKLIST = /hazelmere|triskelion|brimstone|clue scroll|treasure hunter|starved ancient effigy|dragonkin lamp/i;

// Curated boss list: kill/clear times are estimates the user overrides in
// the UI. wikiPage is the page we scrape drops from.
const BOSSES = [
  { slug: 'general-graardor',  name: 'General Graardor',           wikiPage: 'General Graardor',            category: 'GWD1',    encounter: 'kill',  defaultSeconds: 50 },
  { slug: 'kril-tsutsaroth',   name: "K'ril Tsutsaroth",           wikiPage: "K'ril Tsutsaroth",            category: 'GWD1',    encounter: 'kill',  defaultSeconds: 55 },
  { slug: 'kreearra',          name: "Kree'arra",                  wikiPage: "Kree'arra",                   category: 'GWD1',    encounter: 'kill',  defaultSeconds: 60 },
  { slug: 'commander-zilyana', name: 'Commander Zilyana',          wikiPage: 'Commander Zilyana',           category: 'GWD1',    encounter: 'kill',  defaultSeconds: 55 },
  { slug: 'nex',               name: 'Nex',                        wikiPage: 'Nex',                         category: 'GWD1',    encounter: 'kill',  defaultSeconds: 110 },
  { slug: 'vindicta',          name: 'Vindicta & Gorvek',          wikiPage: 'Vindicta',                    category: 'GWD2',    encounter: 'kill',  defaultSeconds: 90 },
  { slug: 'gregorovic',        name: 'Gregorovic',                 wikiPage: 'Gregorovic',                  category: 'GWD2',    encounter: 'kill',  defaultSeconds: 95 },
  { slug: 'helwyr',            name: 'Helwyr',                     wikiPage: 'Helwyr',                      category: 'GWD2',    encounter: 'kill',  defaultSeconds: 85 },
  { slug: 'twin-furies',       name: 'Twin Furies',                wikiPage: 'Twin Furies',                 category: 'GWD2',    encounter: 'kill',  defaultSeconds: 90 },
  { slug: 'telos',             name: 'Telos, the Warden',          wikiPage: 'Telos, the Warden',           category: 'Endgame', encounter: 'kill',  defaultSeconds: 180 },
  { slug: 'araxxi',            name: 'Araxxi',                     wikiPage: 'Araxxi',                      category: 'Endgame', encounter: 'kill',  defaultSeconds: 170 },
  { slug: 'kalphite-king',     name: 'Kalphite King',              wikiPage: 'Kalphite King',               category: 'Endgame', encounter: 'kill',  defaultSeconds: 90 },
  { slug: 'vorago',            name: 'Vorago',                     wikiPage: 'Vorago',                      category: 'Endgame', encounter: 'clear', defaultSeconds: 600 },
  { slug: 'solak',             name: 'Solak',                      wikiPage: 'Solak',                       category: 'Endgame', encounter: 'clear', defaultSeconds: 360 },
  { slug: 'kerapac',           name: 'Kerapac, the Bound',         wikiPage: 'Kerapac, the Bound',          category: 'Modern',  encounter: 'kill',  defaultSeconds: 170 },
  { slug: 'raksha',            name: 'Raksha, the Shadow Colossus', wikiPage: 'Raksha, the Shadow Colossus', category: 'Modern',  encounter: 'kill',  defaultSeconds: 150 },
  { slug: 'arch-glacor',       name: 'Arch-Glacor',                wikiPage: 'Arch-Glacor',                 category: 'Modern',  encounter: 'kill',  defaultSeconds: 180 },
  { slug: 'rasial',            name: 'Rasial, the First Necromancer', wikiPage: 'Rasial, the First Necromancer', category: 'Modern', encounter: 'kill', defaultSeconds: 150 },
  { slug: 'zamorak',           name: 'Zamorak, Lord of Chaos',     wikiPage: 'Zamorak, Lord of Chaos',      category: 'Modern',  encounter: 'kill',  defaultSeconds: 180 },
  { slug: 'croesus',           name: 'Croesus',                    wikiPage: 'Croesus',                     category: 'Modern',  encounter: 'clear', defaultSeconds: 300 },
  { slug: 'hermod',            name: 'Hermod, the Spirit of War',  wikiPage: 'Hermod, the Spirit of War',   category: 'Modern',  encounter: 'kill',  defaultSeconds: 60 },
  { slug: 'the-magister',      name: 'The Magister',               wikiPage: 'The Magister',                category: 'Modern',  encounter: 'kill',  defaultSeconds: 130 },
  { slug: 'queen-black-dragon', name: 'Queen Black Dragon',        wikiPage: 'Queen Black Dragon',          category: 'Classic', encounter: 'kill',  defaultSeconds: 150 },
  { slug: 'corporeal-beast',   name: 'Corporeal Beast',            wikiPage: 'Corporeal Beast',             category: 'Classic', encounter: 'kill',  defaultSeconds: 200 },
  { slug: 'kalphite-queen',    name: 'Kalphite Queen',             wikiPage: 'Kalphite Queen',              category: 'Classic', encounter: 'kill',  defaultSeconds: 90 },
  { slug: 'king-black-dragon', name: 'King Black Dragon',          wikiPage: 'King Black Dragon',           category: 'Classic', encounter: 'kill',  defaultSeconds: 75 },
  // Elite Dungeons — full-run clears. Dungeon pages expose the relic /
  // scale / pet rares; signature gear lives on boss pages and isn't pulled.
  { slug: 'dragonkin-laboratory', name: 'Dragonkin Laboratory (full run)', wikiPage: 'Dragonkin Laboratory', category: 'Elite Dungeon', encounter: 'clear', defaultSeconds: 480 },
  { slug: 'temple-of-aminishi',   name: 'Temple of Aminishi (full run)',   wikiPage: 'Temple of Aminishi',   category: 'Elite Dungeon', encounter: 'clear', defaultSeconds: 420 },
  { slug: 'the-shadow-reef',      name: 'The Shadow Reef (full run)',      wikiPage: 'The Shadow Reef',      category: 'Elite Dungeon', encounter: 'clear', defaultSeconds: 540 },
];

function parseRarity(raw) {
  if (!raw) return null;
  const s = raw.replace(/\[[^\]]*\]/g, '').trim();
  if (/always/i.test(s)) return 1;
  const m = s.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ''));
  const den = parseFloat(m[2].replace(/,/g, ''));
  if (!num || !den) return null;
  return den / num; // N where chance = 1/N
}
function parsePrice(raw) {
  if (!raw || /not sold|n\/a/i.test(raw)) return null;
  const m = raw.replace(/,/g, '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

async function scrapeBoss(boss) {
  const r = await http.get('/api.php', {
    params: { action: 'parse', page: boss.wikiPage, format: 'json', prop: 'text', redirects: 1 },
  });
  if (r.data?.error) throw new Error(r.data.error.info);
  const $ = cheerio.load(r.data.parse.text['*']);

  const seen = new Map(); // name -> best (rarest) entry
  $('table').each((_, t) => {
    const headers = $(t).find('tr').first().find('th').map((_, h) => $(h).text().toLowerCase().trim()).get();
    if (!headers.some(h => /rarity/i.test(h))) return;
    const itemCol = headers.findIndex(h => /item/i.test(h));
    const rareCol = headers.findIndex(h => /rarity/i.test(h));
    const priceCol = headers.findIndex(h => /ge price|^price/i.test(h));

    $(t).find('tr').slice(1).each((_, tr) => {
      const cells = $(tr).find('td').map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
      if (cells.length < 3) return;
      const name = (itemCol >= 0 ? cells[itemCol] : cells[0] || '').replace(/\(m\)$/i, '').trim();
      const N = parseRarity(cells[rareCol]);
      const val = priceCol >= 0 ? parsePrice(cells[priceCol]) : null;
      if (!name || !N) return;
      if (N < MIN_N || N > MAX_N) return;
      if (BLOCKLIST.test(name)) return;
      if (val == null || val < MIN_VALUE) return;
      // Keep the rarest instance if a name appears multiple times
      const existing = seen.get(name);
      if (!existing || N > existing.rate) {
        seen.set(name, { name, rate: Math.round(N), value: val });
      }
    });
  });

  return [...seen.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_PER_BOSS);
}

async function main() {
  const out = [];
  const list = BOSSES.filter(b => !b.skip);
  for (let i = 0; i < list.length; i++) {
    const boss = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${boss.name} … `);
    try {
      const drops = await scrapeBoss(boss);
      out.push({
        slug: boss.slug, name: boss.name, category: boss.category,
        encounter: boss.encounter, defaultSeconds: boss.defaultSeconds,
        members: true, drops,
      });
      console.log(`${drops.length} rares`);
    } catch (err) {
      console.log('ERR:', err.message);
      out.push({
        slug: boss.slug, name: boss.name, category: boss.category,
        encounter: boss.encounter, defaultSeconds: boss.defaultSeconds,
        members: true, drops: [], error: err.message,
      });
    }
    await sleep(1100);
  }

  // Drop bosses we couldn't get any rares for (enrage-scaling tables etc.)
  const withDrops = out.filter(b => b.drops.length > 0);
  const empty = out.filter(b => b.drops.length === 0);

  fs.writeFileSync(OUT, JSON.stringify({
    generated_at: new Date().toISOString(),
    note: 'Drop rates + GE prices scraped from runescape.wiki. Kill/clear times are curated estimates. Re-run server/jobs/scrapeBossDrops.js to refresh.',
    bosses: withDrops,
  }, null, 2));

  console.log(`\nWrote ${withDrops.length} bosses with rares to ${OUT}`);
  if (empty.length) console.log(`No parseable rares for: ${empty.map(b => b.name).join(', ')}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
