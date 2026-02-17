const express = require('express');
const router = express.Router();
const { Character } = require('../models');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Get all characters for current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const characters = await Character.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']]
    });
    res.json(characters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new character
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Character name is required' });

    // Basic validation to prevent duplicates?
    // Jagex names are unique, but users might try to add connection twice.
    // Let's allow it for now or check.
    const existing = await Character.findOne({
      where: { userId: req.user.id, name }
    });
    if (existing) {
      return res.status(400).json({ message: 'Character already added' });
    }

    const newChar = await Character.create({
      name,
      userId: req.user.id
    });
    res.status(201).json(newChar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update character (e.g. tasks)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned_tasks, task_state, block_list } = req.body;
    
    const character = await Character.findOne({
      where: { id, userId: req.user.id }
    });

    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    if (pinned_tasks !== undefined) character.pinned_tasks = pinned_tasks;
    if (task_state !== undefined) character.task_state = task_state;
    if (block_list !== undefined) character.block_list = block_list;

    await character.save();
    res.json(character);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a character
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Character.destroy({
      where: { id, userId: req.user.id }
    });
    if (deleted) {
      res.json({ message: 'Character deleted' });
    } else {
      res.status(404).json({ message: 'Character not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
