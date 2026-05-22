// Snapshot + leaderboard service for groups (clan/friends/alts).
//
//   - resolveTrackedPlayer(name) → finds-or-creates a TrackedPlayer row
//   - snapshotTrackedPlayer(player) → fetches from hiscores, writes snapshot
//   - snapshotGroup(group) → throttled bulk snapshot of all members
//   - computeLeaderboard(group, windowHours, skill) → diff table
//
// On-demand model: snapshots only happen when someone explicitly refreshes
// a group. We dedupe by re-fetch window (default 1h) so opening the page
// 10 times in a row doesn't blast Jagex.
const { Op } = require('sequelize');
const { TrackedPlayer, TrackedPlayerXpSnapshot, Group, GroupMember } = require('../models');
const { fetchHiscoresXp, SKILL_NAMES } = require('./xpSnapshots');
const logger = require('../utils/logger');

async function resolveTrackedPlayer(rsName) {
  const clean = String(rsName).trim();
  if (!clean) throw new Error('Empty player name');
  const [player] = await TrackedPlayer.findOrCreate({
    where: { rs_name: clean },
    defaults: { rs_name: clean, status: 'active' },
  });
  return player;
}

// No client-side dedupe — every call fetches fresh from Jagex. The
// `force` parameter is kept for signature stability but no longer affects
// behaviour. If Jagex starts rate-limiting we can reintroduce throttling
// at a smaller window.
async function snapshotTrackedPlayer(player /* eslint-disable-line no-unused-vars */, source = 'auto', _force = false) {
  try {
    const xp = await fetchHiscoresXp(player.rs_name);
    if (!xp) {
      player.status = 'error';
      await player.save();
      return { snapshot: null, skipped: false, error: 'no_data' };
    }
    const snapshot = await TrackedPlayerXpSnapshot.create({
      trackedPlayerId: player.id,
      xp,
      source,
    });
    player.status = 'active';
    player.last_fetched_at = new Date();
    await player.save();
    return { snapshot, skipped: false };
  } catch (err) {
    const is404 = err.response?.status === 404;
    player.status = is404 ? 'not_found' : 'error';
    player.last_fetched_at = new Date();
    await player.save();
    return { snapshot: null, skipped: false, error: is404 ? 'not_found' : err.message };
  }
}

// Snapshot every member of a group, throttled at ~1 req/sec to stay polite
// to Jagex. Every call fetches fresh — no per-player dedupe.
async function snapshotGroup(group, source = 'auto') {
  const members = await GroupMember.findAll({
    where: { groupId: group.id },
    include: [{ model: TrackedPlayer, as: 'trackedPlayer' }],
  });
  const results = [];
  for (let i = 0; i < members.length; i++) {
    const p = members[i].trackedPlayer;
    const r = await snapshotTrackedPlayer(p, source);
    results.push({ rs_name: p.rs_name, ...r });
    if (i < members.length - 1) {
      await new Promise(res => setTimeout(res, 1100));
    }
  }
  return results;
}

// Build the leaderboard payload. windowHours determines the gain window;
// null means "all-time" (oldest snapshot ever for each player). Returns
// one row per member with a full per-skill `gains` map so the client
// can pivot freely (transposed view, skill filter, etc.) without
// another round-trip.
async function computeLeaderboard(group, windowHours = 24 * 7) {
  const members = await GroupMember.findAll({
    where: { groupId: group.id },
    include: [{ model: TrackedPlayer, as: 'trackedPlayer' }],
  });

  const since = windowHours ? new Date(Date.now() - windowHours * 60 * 60 * 1000) : null;
  const rows = [];

  for (const m of members) {
    const tp = m.trackedPlayer;
    const newest = await TrackedPlayerXpSnapshot.findOne({
      where: { trackedPlayerId: tp.id },
      order: [['capturedAt', 'DESC']],
    });
    const oldest = await TrackedPlayerXpSnapshot.findOne({
      where: {
        trackedPlayerId: tp.id,
        ...(since ? { capturedAt: { [Op.gte]: since } } : {}),
      },
      order: [['capturedAt', 'ASC']],
    });

    const currentXp = newest?.xp || null;
    const baseXp = oldest?.xp || null;
    const hasGainData = currentXp && baseXp && newest.id !== oldest.id;

    const gains = {};
    if (hasGainData) {
      for (const skill of SKILL_NAMES) {
        gains[skill] = Math.max(0, (currentXp[skill] ?? 0) - (baseXp[skill] ?? 0));
      }
    }

    rows.push({
      member_id: m.id,
      display_name: m.display_name || tp.rs_name,
      rs_name: tp.rs_name,
      status: tp.status,
      last_fetched_at: tp.last_fetched_at,
      current_xp: currentXp,         // full map (all skills) or null
      gains: hasGainData ? gains : null,
      overall_gain: hasGainData ? gains.Overall : null,
      baseline_at: oldest?.capturedAt || null,
      newest_at: newest?.capturedAt || null,
    });
  }

  // Sort: highest Overall gain first; no-data rows at the bottom.
  rows.sort((a, b) => {
    if (a.overall_gain == null && b.overall_gain == null) return a.display_name.localeCompare(b.display_name);
    if (a.overall_gain == null) return 1;
    if (b.overall_gain == null) return -1;
    return b.overall_gain - a.overall_gain;
  });

  return rows;
}

module.exports = {
  SKILL_NAMES,
  resolveTrackedPlayer,
  snapshotTrackedPlayer,
  snapshotGroup,
  computeLeaderboard,
};
