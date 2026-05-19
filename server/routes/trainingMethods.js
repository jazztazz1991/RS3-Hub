const express = require('express');
const router = express.Router();
const { getMethodsForSkill } = require('../services/trainingMethods');
const logger = require('../utils/logger');

// GET /api/training-methods?skill=Mining
router.get('/', async (req, res) => {
  try {
    const skill = String(req.query.skill || '').trim();
    if (!skill) return res.status(400).json({ message: 'skill query param required' });
    const methods = await getMethodsForSkill(skill);
    res.json({ skill, methods });
  } catch (err) {
    logger.error('GET /api/training-methods failed', err, { skill: req.query.skill });
    res.status(500).json({ message: 'Failed to load training methods' });
  }
});

module.exports = router;
