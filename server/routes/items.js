const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  Item,
  ItemRecipe,
  ItemProduct,
  ItemDisassembly,
  ItemDrop,
  ItemShop,
} = require('../models');
const { buildRecipeTree } = require('../services/recipeTree');

// GET /api/items?q=&category=&trainable=true&limit=50
router.get('/', async (req, res) => {
  try {
    const { q, category, trainable, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) where.name = { [Op.iLike]: `%${q}%` };
    if (category) where.categories = { [Op.contains]: [category] };
    if (trainable === 'true') where.is_trainable = true;

    const items = await Item.findAndCountAll({
      where,
      attributes: ['id', 'slug', 'name', 'image_url', 'members', 'ge_price_current', 'categories'],
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      offset: parseInt(offset, 10) || 0,
      order: [['name', 'ASC']],
    });
    res.json({ count: items.count, results: items.rows });
  } catch (err) {
    console.error('items list error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/items/:slug/recipe-tree — recursive recipe expansion for the
// Ironman planner. Returns the target's primary recipe plus its materials,
// with each material expanded if it itself has a Herblore-skill recipe.
router.get('/:slug/recipe-tree', async (req, res) => {
  try {
    const depth = Math.min(parseInt(req.query.depth, 10) || 4, 6);
    const preferSkill = req.query.skill || 'Herblore';
    const tree = await buildRecipeTree(req.params.slug, { depth, preferSkill });
    if (!tree || tree.unknown) return res.status(404).json({ message: 'Item not found' });
    res.json(tree);
  } catch (err) {
    console.error('recipe-tree error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/items/:slug — full detail with related sections
router.get('/:slug', async (req, res) => {
  try {
    const item = await Item.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: ItemRecipe, as: 'recipes' },
        { model: ItemProduct, as: 'products' },
        { model: ItemDisassembly, as: 'disassembly' },
        { model: ItemDrop, as: 'drops' },
        { model: ItemShop, as: 'shops' },
      ],
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('item detail error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
