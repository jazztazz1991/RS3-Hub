const express = require('express');
const router = express.Router();
const { Report } = require('../models');

const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden' });
};

// POST /api/reports - Create a new bug report (Public/Authenticated)
router.post('/', async (req, res) => {
    try {
        const { type, description, contextData, path, browser } = req.body;
        
        const reportData = {
            type: type || 'bug',
            description,
            contextData,
            path,
            browser,
            status: 'open'
        };

        // If user is logged in, attach their ID
        if (req.isAuthenticated && req.isAuthenticated()) {
            reportData.userId = req.user.id;
        }

        const report = await Report.create(reportData);
        
        res.status(201).json({ 
            success: true, 
            message: 'Report submitted successfully',
            reportId: report.id 
        });

    } catch (err) {
        console.error('Error submitting report:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit report' 
        });
    }
});

// GET /api/reports - Get all reports (Admin Only)
router.get('/', ensureAdmin, async (req, res) => {
    try {
        const reports = await Report.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch reports' 
        });
    }
});

// PATCH /api/reports/:id/status - Update report status (Admin Only)
router.patch('/:id/status', ensureAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByPk(req.params.id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        report.status = status;
        await report.save();

        res.status(200).json({ success: true, report });
    } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update report' 
        });
    }
});

module.exports = router;
