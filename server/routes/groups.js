const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Group, GroupMember, TrackedPlayer } = require('../models');
const {
  resolveTrackedPlayer,
  snapshotGroup,
  snapshotTrackedPlayer,
  computeLeaderboard,
} = require('../services/groupSnapshots');
const logger = require('../utils/logger');

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Unauthorized' });
}

async function ownedGroup(id, userId) {
  const group = await Group.findOne({ where: { id, ownerId: userId } });
  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  return group;
}

// Normalize the windowHours query param to one of our presets or all-time.
function parseWindow(raw) {
  const v = String(raw || 'week').toLowerCase();
  if (v === 'day' || v === '24h') return 24;
  if (v === 'week' || v === '7d') return 24 * 7;
  if (v === 'month' || v === '30d') return 24 * 30;
  if (v === 'all' || v === 'all-time') return null;
  const n = parseInt(v, 10);
  if (Number.isFinite(n) && n > 0 && n <= 24 * 365) return n;
  return 24 * 7;
}

// POST /api/groups — create with member list
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, kind, members } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'At least one member is required' });
    }
    if (members.length > 200) {
      return res.status(400).json({ message: 'Groups are capped at 200 members' });
    }

    // Resolve names → TrackedPlayers (deduped) AND verify each one exists
    // on the hiscores before adding them. Names that 404 are surfaced back
    // to the caller so the user can fix typos before the group is finalised.
    const seen = new Set();
    const accepted = [];        // [{tp, display}]
    const invalid = [];         // names that failed hiscores lookup
    for (const raw of members) {
      const rsName = typeof raw === 'string' ? raw : raw?.rs_name;
      const display = typeof raw === 'object' ? raw?.display_name : null;
      if (!rsName) continue;
      const trimmed = String(rsName).trim();
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const tp = await resolveTrackedPlayer(trimmed);
      // Force-snapshot serves double duty: validates the name AND establishes
      // the baseline for gain calculations.
      const result = await snapshotTrackedPlayer(tp, 'manual', true);
      if (result.error === 'not_found') {
        invalid.push(trimmed);
      } else {
        accepted.push({ tp, display });
      }
      // Polite delay between hiscore lookups
      await new Promise(r => setTimeout(r, 1100));
    }

    if (accepted.length === 0) {
      return res.status(400).json({
        message: 'None of the names were found on hiscores. Check spelling (case + spaces matter) and try again.',
        invalid_names: invalid,
      });
    }

    const group = await Group.create({
      ownerId: req.user.id,
      name: String(name).trim(),
      description: description ? String(description).slice(0, 1000) : null,
      kind: ['clan', 'friends', 'alts', 'comp'].includes(kind) ? kind : 'friends',
    });

    for (const { tp, display } of accepted) {
      await GroupMember.create({
        groupId: group.id,
        trackedPlayerId: tp.id,
        display_name: display ? String(display).slice(0, 60) : null,
      });
    }

    res.status(201).json({
      id: group.id,
      share_token: group.share_token,
      name: group.name,
      added: accepted.length,
      invalid_names: invalid,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group create failed', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups — owner's groups
router.get('/', requireAuth, async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { ownerId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    const summary = [];
    for (const g of groups) {
      const memberCount = await GroupMember.count({ where: { groupId: g.id } });
      summary.push({
        id: g.id,
        name: g.name,
        description: g.description,
        kind: g.kind,
        share_token: g.share_token,
        member_count: memberCount,
        createdAt: g.createdAt,
      });
    }
    res.json(summary);
  } catch (err) {
    logger.error('group list failed', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/:id — owner view (full detail)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const group = await ownedGroup(req.params.id, req.user.id);
    const windowHours = parseWindow(req.query.window);
    const leaderboard = await computeLeaderboard(group, windowHours);
    res.json({
      id: group.id,
      name: group.name,
      description: group.description,
      kind: group.kind,
      share_token: group.share_token,
      window: req.query.window || 'week',
      leaderboard,
      owner: true,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group fetch failed', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/share/:token — public read-only view
router.get('/share/:token', async (req, res) => {
  try {
    const group = await Group.findOne({ where: { share_token: req.params.token } });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const windowHours = parseWindow(req.query.window);
    const leaderboard = await computeLeaderboard(group, windowHours);
    res.json({
      id: group.id,
      name: group.name,
      description: group.description,
      kind: group.kind,
      window: req.query.window || 'week',
      leaderboard,
      owner: false,
    });
  } catch (err) {
    logger.error('group share fetch failed', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/:id/refresh — fetch fresh hiscores for all members
router.post('/:id/refresh', requireAuth, async (req, res) => {
  try {
    const group = await ownedGroup(req.params.id, req.user.id);
    const results = await snapshotGroup(group, 'manual');
    res.json({
      refreshed: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      details: results,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group refresh failed', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/share/:token/refresh — public viewer can also trigger a refresh.
router.post('/share/:token/refresh', async (req, res) => {
  try {
    const group = await Group.findOne({ where: { share_token: req.params.token } });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const results = await snapshotGroup(group, 'auto');
    res.json({
      refreshed: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
    });
  } catch (err) {
    logger.error('public group refresh failed', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/groups/:id — rename or update kind/description
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const group = await ownedGroup(req.params.id, req.user.id);
    const { name, description, kind } = req.body || {};
    if (name) group.name = String(name).trim();
    if (description !== undefined) group.description = description ? String(description).slice(0, 1000) : null;
    if (kind && ['clan', 'friends', 'alts', 'comp'].includes(kind)) group.kind = kind;
    await group.save();
    res.json({ id: group.id, name: group.name, description: group.description, kind: group.kind });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group update failed', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/:id/members — add a member (validates against hiscores)
router.post('/:id/members', requireAuth, async (req, res) => {
  try {
    const group = await ownedGroup(req.params.id, req.user.id);
    const { rs_name, display_name } = req.body || {};
    if (!rs_name || !String(rs_name).trim()) return res.status(400).json({ message: 'rs_name required' });
    const count = await GroupMember.count({ where: { groupId: group.id } });
    if (count >= 200) return res.status(400).json({ message: 'Group is at the 200-member cap' });
    const tp = await resolveTrackedPlayer(rs_name);
    // Verify the name exists on hiscores before accepting the member.
    const result = await snapshotTrackedPlayer(tp, 'manual', true);
    if (result.error === 'not_found') {
      return res.status(400).json({
        message: `"${rs_name}" was not found on the RS3 hiscores. Check spelling (case + spaces matter).`,
      });
    }
    const [member, created] = await GroupMember.findOrCreate({
      where: { groupId: group.id, trackedPlayerId: tp.id },
      defaults: {
        groupId: group.id,
        trackedPlayerId: tp.id,
        display_name: display_name ? String(display_name).slice(0, 60) : null,
      },
    });
    res.status(created ? 201 : 200).json({ id: member.id, rs_name: tp.rs_name, already: !created });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group add member failed', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/groups/:id/members/:memberId
router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
  try {
    const group = await ownedGroup(req.params.id, req.user.id);
    const member = await GroupMember.findOne({ where: { id: req.params.memberId, groupId: group.id } });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await member.destroy();
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group remove member failed', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const group = await ownedGroup(req.params.id, req.user.id);
    await GroupMember.destroy({ where: { groupId: group.id } });
    await group.destroy();
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('group delete failed', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
