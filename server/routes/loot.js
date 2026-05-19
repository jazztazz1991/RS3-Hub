const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { LootActivity, LootDrop, Character, Item } = require('../models');
const logger = require('../utils/logger');

// All loot routes require auth. Ownership is enforced by joining through
// Character (which carries userId).
function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Unauthorized' });
}

// Verify a characterId belongs to the authed user; returns the character or
// throws an authorization error (caught in the route).
async function verifyCharacterOwnership(characterId, userId) {
  const character = await Character.findOne({
    where: { id: characterId, userId },
    attributes: ['id'],
  });
  if (!character) {
    const err = new Error('Character not found or not owned by user');
    err.status = 403;
    throw err;
  }
  return character;
}

const VALID_CATEGORIES = ['boss', 'skilling', 'misc'];

// ── Activities ─────────────────────────────────────────────────────────────

// GET /api/loot?characterId=&category=
router.get('/', requireAuth, async (req, res) => {
  try {
    const { characterId, category } = req.query;
    if (!characterId) return res.status(400).json({ message: 'characterId required' });
    await verifyCharacterOwnership(characterId, req.user.id);

    const where = { characterId };
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;

    const activities = await LootActivity.findAll({
      where,
      include: [{
        model: LootDrop,
        as: 'drops',
        include: [{ model: Item, as: 'item', attributes: ['slug', 'name', 'image_url', 'ge_price_current'] }],
      }],
      order: [['updatedAt', 'DESC']],
    });
    res.json(activities);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('GET /api/loot failed', err);
    res.status(500).json({ message: 'Failed to load activities' });
  }
});

// POST /api/loot — { characterId, name, category, kill_count?, notes? }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { characterId, name, category, kill_count, notes } = req.body;
    if (!characterId || !name) {
      return res.status(400).json({ message: 'characterId and name required' });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category must be one of ${VALID_CATEGORIES.join(', ')}` });
    }
    await verifyCharacterOwnership(characterId, req.user.id);

    const activity = await LootActivity.create({
      characterId,
      name: name.trim(),
      category: category || 'misc',
      kill_count: kill_count != null ? Math.max(0, parseInt(kill_count, 10) || 0) : 0,
      notes: notes || null,
    });
    res.status(201).json(activity);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('POST /api/loot failed', err);
    res.status(500).json({ message: 'Failed to create activity' });
  }
});

// Helper to load and authorize an activity by id.
async function loadOwnedActivity(activityId, userId) {
  const activity = await LootActivity.findByPk(activityId);
  if (!activity) {
    const err = new Error('Activity not found');
    err.status = 404;
    throw err;
  }
  await verifyCharacterOwnership(activity.characterId, userId);
  return activity;
}

// PATCH /api/loot/:id — partial update
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const activity = await loadOwnedActivity(req.params.id, req.user.id);
    const { name, category, kill_count, notes, total_time_seconds } = req.body;
    if (name != null) activity.name = String(name).trim();
    if (category != null) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'invalid category' });
      }
      activity.category = category;
    }
    if (kill_count != null) activity.kill_count = Math.max(0, parseInt(kill_count, 10) || 0);
    if (notes !== undefined) activity.notes = notes || null;
    if (total_time_seconds !== undefined) activity.total_time_seconds = total_time_seconds || null;
    await activity.save();
    res.json(activity);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('PATCH /api/loot/:id failed', err);
    res.status(500).json({ message: 'Failed to update activity' });
  }
});

// DELETE /api/loot/:id (cascades to drops)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const activity = await loadOwnedActivity(req.params.id, req.user.id);
    await activity.destroy();
    res.json({ success: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('DELETE /api/loot/:id failed', err);
    res.status(500).json({ message: 'Failed to delete activity' });
  }
});

// ── Drops ──────────────────────────────────────────────────────────────────

// POST /api/loot/:id/drops — { itemId?, item_name, quantity }
// Upsert behavior: if a drop with the same (activityId, itemId, item_name)
// exists, the quantity is added to it. Otherwise a new row is created.
router.post('/:id/drops', requireAuth, async (req, res) => {
  try {
    const activity = await loadOwnedActivity(req.params.id, req.user.id);
    const { itemId, item_name, quantity } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    if (!item_name && !itemId) {
      return res.status(400).json({ message: 'item_name or itemId required' });
    }

    // Resolve display name if only itemId given
    let displayName = item_name;
    if (itemId && !displayName) {
      const item = await Item.findByPk(itemId, { attributes: ['name'] });
      if (!item) return res.status(400).json({ message: 'unknown itemId' });
      displayName = item.name;
    }

    // Match existing row by itemId if present, otherwise by name
    const matchWhere = { activityId: activity.id };
    if (itemId) matchWhere.itemId = itemId;
    else matchWhere.item_name = displayName;

    const existing = await LootDrop.findOne({ where: matchWhere });
    let drop;
    if (existing) {
      existing.quantity += qty;
      await existing.save();
      drop = existing;
    } else {
      drop = await LootDrop.create({
        activityId: activity.id,
        itemId: itemId || null,
        item_name: displayName,
        quantity: qty,
      });
    }

    // Re-fetch with item include so the client gets the joined item info
    const full = await LootDrop.findByPk(drop.id, {
      include: [{ model: Item, as: 'item', attributes: ['slug', 'name', 'image_url', 'ge_price_current'] }],
    });
    res.status(existing ? 200 : 201).json(full);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('POST /api/loot/:id/drops failed', err);
    res.status(500).json({ message: 'Failed to log drop' });
  }
});

// PATCH /api/loot/:id/drops/:dropId — change quantity or rename
router.patch('/:id/drops/:dropId', requireAuth, async (req, res) => {
  try {
    const activity = await loadOwnedActivity(req.params.id, req.user.id);
    const drop = await LootDrop.findOne({
      where: { id: req.params.dropId, activityId: activity.id },
    });
    if (!drop) return res.status(404).json({ message: 'Drop not found' });

    const { quantity, item_name } = req.body;
    if (quantity != null) drop.quantity = Math.max(0, parseInt(quantity, 10) || 0);
    if (item_name != null) drop.item_name = String(item_name).trim();
    await drop.save();
    res.json(drop);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('PATCH drop failed', err);
    res.status(500).json({ message: 'Failed to update drop' });
  }
});

// DELETE /api/loot/:id/drops/:dropId
router.delete('/:id/drops/:dropId', requireAuth, async (req, res) => {
  try {
    const activity = await loadOwnedActivity(req.params.id, req.user.id);
    const drop = await LootDrop.findOne({
      where: { id: req.params.dropId, activityId: activity.id },
    });
    if (!drop) return res.status(404).json({ message: 'Drop not found' });
    await drop.destroy();
    res.json({ success: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('DELETE drop failed', err);
    res.status(500).json({ message: 'Failed to delete drop' });
  }
});

module.exports = router;
