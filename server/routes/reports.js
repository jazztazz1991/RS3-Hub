const express = require('express');
const router = express.Router();
const { Report } = require('../models');
const { requireRole, hasRole } = require('../utils/roles');

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

// GET /api/reports - Get reports (Admin gets all, User gets own)
router.get('/', async (req, res) => {
    // Check if authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const queryOptions = {
            order: [['createdAt', 'DESC']]
        };

        // If not admin-tier, filter by user ID
        if (!hasRole(req.user.role, 'admin')) {
            queryOptions.where = { userId: req.user.id };
        }

        const reports = await Report.findAll(queryOptions);
        res.status(200).json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch reports' 
        });
    }
});

// PATCH /api/reports/:id/status - Update report status (admin+)
router.patch('/:id/status', requireRole('admin'), async (req, res) => {
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
