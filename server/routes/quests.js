const express = require('express');
const router = express.Router();
const { UserQuest, Character } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// Middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

// Get all completed quests for user/character
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { characterId } = req.query;
        const whereClause = { userId: req.user.id };
        
        if (characterId) {
            whereClause.characterId = characterId;
        }

        const quests = await UserQuest.findAll({
            where: whereClause,
            attributes: ['questTitle', 'completedAt']
        });
        res.json(quests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle quest status
router.post('/toggle', isAuthenticated, async (req, res) => {
    try {
        const { title, completed, characterId } = req.body;
        
        if (!characterId) {
            return res.status(400).json({ message: "Character ID is required" });
        }

        if (completed) {
            // Upsert
            await UserQuest.upsert({
                userId: req.user.id,
                characterId,
                questTitle: title,
                completed: true,
                completedAt: new Date()
            }, { 
                // Using the specific conflict fields for upsert
                conflictFields: ['userId', 'characterId', 'questTitle']
            });
        } else {
            // Delete
            await UserQuest.destroy({
                where: {
                    userId: req.user.id,
                    characterId,
                    questTitle: title
                }
            });
        }
        res.json({ success: true, title, completed });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Import from RuneMetrics
router.post('/import', isAuthenticated, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ message: "Username required" });

        // Verify character belongs to user
        const character = await Character.findOne({
            where: { 
                name: username,
                userId: req.user.id
            }
        });

        if (!character) {
             return res.status(404).json({ message: "Character not found or does not belong to user." });
        }

        // Fetch from RuneMetrics
        const rsApiUrl = `https://apps.runescape.com/runemetrics/quests?user=${encodeURIComponent(username)}`;
        const response = await axios.get(rsApiUrl);
        const data = response.data;

        if (!data.quests) {
            return res.status(404).json({ message: "No quest data found. Is profile public?" });
        }

        const completedQuests = data.quests
            .filter(q => q.status === "COMPLETED")
            .map(q => ({
                userId: req.user.id,
                characterId: character.id,
                questTitle: q.title,
                completed: true,
                completedAt: new Date()
            }));

        // Always sync the state - remove any quests that are NOT in the completed list from Runemetrics
        // BUT ONLY FOR THIS CHARACTER
        const completedTitles = completedQuests.map(q => q.questTitle);
        
        if (completedTitles.length > 0) {
            await UserQuest.destroy({
                where: {
                    userId: req.user.id,
                    characterId: character.id,
                    questTitle: { [Op.notIn]: completedTitles }
                }
            });
        } else {
            // If no quests are completed in the import, clear all quests for the character
            await UserQuest.destroy({
                where: { 
                    userId: req.user.id,
                    characterId: character.id
                }
            });
        }

        if (completedQuests.length === 0) {
             return res.json({ message: "No completed quests found. Cleared existing data." });
        }

        // Process sequentially to ensure unique constraint handling is robust
        for (const q of completedQuests) {
            const found = await UserQuest.findOne({
                where: { 
                    userId: q.userId, 
                    characterId: q.characterId, // Add character filter
                    questTitle: q.questTitle 
                }
            });
            if (!found) {
                await UserQuest.create(q);
            } else {
                await found.update(q);
            }
        }

        res.json({ message: `Imported quests successfully`, count: completedQuests.length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to import quests. Check privacy settings." });
    }
});

module.exports = router;
