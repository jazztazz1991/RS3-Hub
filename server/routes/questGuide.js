const express = require('express');
const router = express.Router();
const { fetchQuestQuickGuide } = require('../services/questGuide');
const logger = require('../utils/logger');

// GET /api/quest-quick-guide?title=Plague%27s%20End
router.get('/', async (req, res) => {
  try {
    const title = String(req.query.title || '').trim();
    if (!title) return res.status(400).json({ message: 'title query param required' });
    const guide = await fetchQuestQuickGuide(title);
    res.json(guide);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: 'Quick guide not found on the wiki' });
    logger.error('GET /api/quest-quick-guide failed', err, { title: req.query.title });
    res.status(500).json({ message: 'Failed to fetch quick guide' });
  }
});

module.exports = router;
