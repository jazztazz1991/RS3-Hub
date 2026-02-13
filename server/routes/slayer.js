const express = require('express');
const router = express.Router();
const { SlayerTask } = require('../models');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Get all slayer tasks for current user
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const tasks = await SlayerTask.findAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']]
    });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching slayer history:", err);
    res.status(500).json({ message: err.message });
  }
});

// Save a completed task
router.post('/log', isAuthenticated, async (req, res) => {
  try {
    const { 
      monsterId, 
      monsterName, 
      masterName, 
      count, 
      duration, 
      timestamp, 
      notes, 
      xpPerKill, 
      totalXp 
    } = req.body;

    const newTask = await SlayerTask.create({
      userId: req.user.id,
      monsterId,
      monsterName,
      masterName,
      count,
      duration,
      timestamp: timestamp || new Date(),
      notes,
      xpPerKill,
      totalXp
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error("Error saving slayer task:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a task (optional but good to have)
router.delete('/log/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await SlayerTask.destroy({
            where: { 
                id: req.params.id,
                userId: req.user.id
            }
        });
        
        if (result === 0) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
