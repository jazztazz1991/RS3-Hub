const express = require('express');
const router = express.Router();
const { User, PageVisit } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { requireRole, ROLE_HIERARCHY } = require('../utils/roles');

const VALID_ROLES = ['user', 'admin', 'manager', 'co-owner', 'owner'];

// GET /api/users - List all users (manager+)
router.get('/', requireRole('manager'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'isActive', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/analytics - Analytics stats (co-owner+)
router.get('/analytics', requireRole('co-owner'), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, newUsersThisMonth, mauRegistered, uniqueSessionsThisMonth, rawDailyVisits] = await Promise.all([
      User.count(),
      User.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
      User.count({ where: { last_active: { [Op.gte]: thirtyDaysAgo } } }),
      PageVisit.count({ distinct: true, col: 'session_id', where: { timestamp: { [Op.gte]: thirtyDaysAgo } } }),
      PageVisit.findAll({
        attributes: [
          [fn('DATE', col('timestamp')), 'date'],
          [literal('COUNT(DISTINCT session_id)'), 'sessions'],
          [literal('COUNT(DISTINCT user_id)'), 'registeredUsers'],
        ],
        where: { timestamp: { [Op.gte]: thirtyDaysAgo } },
        group: [fn('DATE', col('timestamp'))],
        order: [[literal('DATE(timestamp)'), 'ASC']],
        raw: true
      })
    ]);

    // Build a full 30-day array, filling in zero for days with no visits
    const dailyMap = {};
    rawDailyVisits.forEach(row => {
      dailyMap[row.date] = {
        sessions: parseInt(row.sessions) || 0,
        registeredUsers: parseInt(row.registeredUsers) || 0
      };
    });

    const dailyVisits = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyVisits.push({
        date: key,
        sessions: dailyMap[key]?.sessions || 0,
        registeredUsers: dailyMap[key]?.registeredUsers || 0
      });
    }

    res.json({ totalUsers, newUsersThisMonth, mauRegistered, uniqueSessionsThisMonth, dailyVisits });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/role - Assign role (owner only)
router.patch('/:id/role', requireRole('owner'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/status - Toggle active status (manager+)
router.patch('/:id/status', requireRole('manager'), async (req, res) => {
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
