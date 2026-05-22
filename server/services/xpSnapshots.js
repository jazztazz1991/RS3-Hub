// XP snapshot service.
//   - fetchHiscoresXp(name) → { Attack: 13M, ..., Overall: 540M }
//   - snapshotCharacter(character, source) → writes a CharacterXpSnapshot
//   - snapshotAllOptedIn() → daily-cron entry point
//
// XP data source: Jagex public hiscores (CSV). We re-use the same endpoint
// the dashboard hits; the only difference is we parse + persist instead
// of returning to a client.
const axios = require('axios');
const { Op } = require('sequelize');
const { Character, CharacterXpSnapshot } = require('../models');
const logger = require('../utils/logger');

// Skill names in hiscores CSV order (matches client/src/utils/rs3.js).
const SKILL_NAMES = [
  'Overall',
  'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged', 'Prayer', 'Magic',
  'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting',
  'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer',
  'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning',
  'Dungeoneering', 'Divination', 'Invention', 'Archaeology', 'Necromancy',
];

const HISCORES_URL = 'https://secure.runescape.com/m=hiscore/index_lite.ws';

// Re-snapshot guard: skip if a snapshot already exists in the last 12 hours.
const RESNAP_WINDOW_HOURS = 12;

async function fetchHiscoresXp(playerName) {
  const res = await axios.get(HISCORES_URL, {
    params: { player: playerName },
    timeout: 20000,
    responseType: 'text',
  });
  return parseHiscoresCsv(res.data);
}

function parseHiscoresCsv(csv) {
  if (!csv) return null;
  const lines = csv.split('\n');
  const xp = {};
  for (let i = 0; i < SKILL_NAMES.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const [rank, , xpStr] = line.split(',');
    // Unranked rows return -1; treat as 0 XP so the diff math doesn't blow up.
    if (rank === '-1') { xp[SKILL_NAMES[i]] = 0; continue; }
    const n = parseInt(xpStr, 10);
    if (Number.isFinite(n)) xp[SKILL_NAMES[i]] = n;
  }
  return xp;
}

async function snapshotCharacter(character, source = 'manual') {
  // De-dupe: if we already have a fresh snapshot, return it instead.
  const cutoff = new Date(Date.now() - RESNAP_WINDOW_HOURS * 60 * 60 * 1000);
  const recent = await CharacterXpSnapshot.findOne({
    where: { characterId: character.id, capturedAt: { [Op.gte]: cutoff } },
    order: [['capturedAt', 'DESC']],
  });
  if (recent && source !== 'manual') {
    return { snapshot: recent, skipped: true };
  }

  const xp = await fetchHiscoresXp(character.name);
  if (!xp) throw new Error(`Failed to parse hiscores for ${character.name}`);

  const snapshot = await CharacterXpSnapshot.create({
    characterId: character.id,
    xp,
    source,
    capturedAt: new Date(),
  });
  return { snapshot, skipped: false };
}

// Daily-cron entry point. Snapshots every character with xp_tracking_enabled.
// Throttled to 1 req/sec to be kind to Jagex.
async function snapshotAllOptedIn() {
  const characters = await Character.findAll({
    where: { xp_tracking_enabled: true },
    attributes: ['id', 'name'],
  });
  logger.info('Daily XP snapshot starting', { count: characters.length });

  let ok = 0, skipped = 0, fail = 0;
  for (const c of characters) {
    try {
      const { skipped: wasSkipped } = await snapshotCharacter(c, 'cron');
      if (wasSkipped) skipped++; else ok++;
    } catch (err) {
      fail++;
      logger.error('XP snapshot failed for character', err, { name: c.name });
    }
    await new Promise(r => setTimeout(r, 1100)); // ~1 req/s
  }
  logger.info('Daily XP snapshot done', { ok, skipped, fail });
  return { ok, skipped, fail };
}

module.exports = {
  SKILL_NAMES,
  fetchHiscoresXp,
  snapshotCharacter,
  snapshotAllOptedIn,
};
