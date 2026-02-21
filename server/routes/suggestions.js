const express = require('express');
const router = express.Router();
const { Suggestion } = require('../models');

const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden' });
};

// POST /api/suggestions - Create a new suggestion (Public/Authenticated)
router.post('/', async (req, res) => {
    try {
        const { description, contextData, path, browser } = req.body;
        
        const suggestionData = {
            description,
            contextData,
            path,
            browser,
            status: 'open'
        };

        // If user is logged in, attach their ID
        if (req.isAuthenticated && req.isAuthenticated()) {
            suggestionData.userId = req.user.id;
        }

        const suggestion = await Suggestion.create(suggestionData);
        res.status(201).json({ success: true, suggestion });
    } catch (err) {
        console.error('Error creating suggestion:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create suggestion' 
        });
    }
});

// GET /api/suggestions - Get all suggestions
router.get('/', async (req, res) => {
    // Check if authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const suggestions = await Suggestion.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(suggestions);
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch suggestions' 
        });
    }
});

// PATCH /api/suggestions/:id/status - Update suggestion status (Admin Only)
router.patch('/:id/status', ensureAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const suggestion = await Suggestion.findByPk(req.params.id);
        
        if (!suggestion) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }

        suggestion.status = status;
        await suggestion.save();

        res.status(200).json({ success: true, suggestion });
    } catch (err) {
        console.error('Error updating suggestion:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update suggestion' 
        });
    }
});

module.exports = router;
