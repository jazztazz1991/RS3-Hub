const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { PageVisit } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (hashing is handled by model hook)
    const newUser = await User.create({
      email,
      password_hash: password,
      username
    });

    // Login immediately after registration
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      return res.json({ user: newUser, message: 'Registration successful' });
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login (Local)
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });
    
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ user, message: 'Login successful' });
    });
  })(req, res, next);
});

/*
// Google Info
// Using 'profile' and 'email' scopes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    // Successful authentication, redirect to client.
    // Ensure CLIENT_URL is set in .env
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);
*/

// Logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get Current User
router.get('/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.send(null);
  }

  // Fire-and-forget: log visit and update last_active (never blocks response)
  PageVisit.create({
    session_id: req.sessionID,
    user_id: req.user?.id || null,
    timestamp: new Date()
  }).catch(() => {});

  if (req.user) {
    User.update({ last_active: new Date() }, { where: { id: req.user.id } }).catch(() => {});
  }

  // Occasional cleanup: remove visits older than 90 days (~1% of requests)
  if (Math.random() < 0.01) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    PageVisit.destroy({ where: { timestamp: { [Op.lt]: ninetyDaysAgo } } }).catch(() => {});
  }
});

module.exports = router;
