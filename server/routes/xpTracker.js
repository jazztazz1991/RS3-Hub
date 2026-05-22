const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Character, CharacterXpSnapshot } = require('../models');
const { snapshotCharacter, SKILL_NAMES } = require('../services/xpSnapshots');
const logger = require('../utils/logger');

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Unauthorized' });
}

async function ownedCharacter(characterId, userId) {
  const character = await Character.findOne({ where: { id: characterId, userId } });
  if (!character) {
    const err = new Error('Character not found');
    err.status = 404;
    throw err;
  }
  return character;
}

// GET /api/xp-tracker/:characterId/history?skill=Overall&days=30
// Returns time-series snapshots for one skill (or all skills if omitted).
router.get('/:characterId/history', requireAuth, async (req, res) => {
  try {
    const character = await ownedCharacter(req.params.characterId, req.user.id);
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const skill = req.query.skill || null;

    const snapshots = await CharacterXpSnapshot.findAll({
      where: { characterId: character.id, capturedAt: { [Op.gte]: since } },
      order: [['capturedAt', 'ASC']],
      attributes: ['capturedAt', 'xp'],
    });

    if (skill) {
      const series = snapshots
        .filter(s => s.xp?.[skill] != null)
        .map(s => ({ t: s.capturedAt, xp: s.xp[skill] }));
      return res.json({ skill, days, points: series });
    }
    res.json({ days, snapshots: snapshots.map(s => ({ t: s.capturedAt, xp: s.xp })) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('xp history failed', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/xp-tracker/:characterId/diff?period=day|week|month
// Returns XP gained per skill between the oldest snapshot in the window
// and the newest. Useful for "gained today/this week" tiles.
router.get('/:characterId/diff', requireAuth, async (req, res) => {
  try {
    const character = await ownedCharacter(req.params.characterId, req.user.id);
    const period = req.query.period || 'day';
    const hours = { day: 24, week: 24 * 7, month: 24 * 30 }[period] || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const oldest = await CharacterXpSnapshot.findOne({
      where: { characterId: character.id, capturedAt: { [Op.gte]: since } },
      order: [['capturedAt', 'ASC']],
    });
    const newest = await CharacterXpSnapshot.findOne({
      where: { characterId: character.id },
      order: [['capturedAt', 'DESC']],
    });

    if (!oldest || !newest || oldest.id === newest.id) {
      return res.json({ period, diff: {}, total_gained: 0, oldest_at: null, newest_at: null });
    }

    const diff = {};
    let totalGained = 0;
    for (const skill of SKILL_NAMES) {
      const a = oldest.xp?.[skill] ?? 0;
      const b = newest.xp?.[skill] ?? 0;
      const gained = Math.max(0, b - a);
      if (gained > 0) diff[skill] = gained;
      if (skill === 'Overall') totalGained = gained;
    }
    res.json({
      period,
      oldest_at: oldest.capturedAt,
      newest_at: newest.capturedAt,
      diff,
      total_gained: totalGained,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('xp diff failed', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/xp-tracker/:characterId/dashboard
// Single payload powering the table view: latest snapshot xp + day/week/
// month diff maps with has_enough_data flags so the client can render '—'
// when the window isn't fully populated yet.
router.get('/:characterId/dashboard', requireAuth, async (req, res) => {
  try {
    const character = await ownedCharacter(req.params.characterId, req.user.id);

    const newest = await CharacterXpSnapshot.findOne({
      where: { characterId: character.id },
      order: [['capturedAt', 'DESC']],
    });
    if (!newest) {
      return res.json({
        current_xp: null, latest_at: null,
        day: null, week: null, month: null,
      });
    }

    const periods = { day: 24, week: 24 * 7, month: 24 * 30 };
    const result = { current_xp: newest.xp, latest_at: newest.capturedAt };

    for (const [name, hours] of Object.entries(periods)) {
      const windowMs = hours * 60 * 60 * 1000;
      const since = new Date(Date.now() - windowMs);
      const oldest = await CharacterXpSnapshot.findOne({
        where: { characterId: character.id, capturedAt: { [Op.gte]: since } },
        order: [['capturedAt', 'ASC']],
      });

      // For day, any 2+ snapshots is enough — even a 5-minute span gives
      // useful "gained since this morning" info. For week/month require
      // span >= half a window so we don't label 1 day of data as "weekly".
      const span = oldest ? (newest.capturedAt - oldest.capturedAt) : 0;
      const minSpan = name === 'day' ? 0 : windowMs * 0.5;
      const enough = oldest && newest.id !== oldest.id && span >= minSpan;

      const diff = {};
      let totalGained = 0;
      if (enough) {
        for (const skill of SKILL_NAMES) {
          const a = oldest.xp?.[skill] ?? 0;
          const b = newest.xp?.[skill] ?? 0;
          const gained = Math.max(0, b - a);
          diff[skill] = gained;
          if (skill === 'Overall') totalGained = gained;
        }
      }
      result[name] = {
        has_enough_data: !!enough,
        diff: enough ? diff : null,
        total_gained: totalGained,
        oldest_at: oldest?.capturedAt || null,
        newest_at: newest.capturedAt,
      };
    }

    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('xp dashboard failed', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/xp-tracker/:characterId/snapshot — manual trigger
router.post('/:characterId/snapshot', requireAuth, async (req, res) => {
  try {
    const character = await ownedCharacter(req.params.characterId, req.user.id);
    const { snapshot, skipped } = await snapshotCharacter(character, 'manual');
    res.status(skipped ? 200 : 201).json({ snapshot, skipped });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('manual snapshot failed', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/xp-tracker/:characterId/tracking — toggle xp_tracking_enabled
router.patch('/:characterId/tracking', requireAuth, async (req, res) => {
  try {
    const character = await ownedCharacter(req.params.characterId, req.user.id);
    const enabled = !!req.body.enabled;
    character.xp_tracking_enabled = enabled;
    await character.save();
    // If toggling on, take an immediate baseline snapshot so the user sees data right away.
    if (enabled) {
      try { await snapshotCharacter(character, 'initial'); }
      catch (err) { logger.warn('Initial snapshot after opt-in failed', { message: err.message }); }
    }
    res.json({ id: character.id, xp_tracking_enabled: character.xp_tracking_enabled });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('toggle tracking failed', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
