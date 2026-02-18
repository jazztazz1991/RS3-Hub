const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Middleware to check if user is admin (optional based on requirements)
// For now, ensuring they are logged in is a good start.
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
};

// GET /api/users - List all users
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'isActive', 'isAdmin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/status - Toggle active status
router.patch('/:id/status', ensureAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
