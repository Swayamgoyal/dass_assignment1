const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole, optionalAuth } = require('../middleware/auth');
const {
    browseEvents,
    getEventDetails,
    getTrendingEvents,
    getFollowedEvents,
    getEventCalendar
} = require('../controllers/publicEventsController');

// Public routes (no authentication required)
// IMPORTANT: Specific routes MUST come before parameterized routes (:id)
router.get('/trending', getTrendingEvents);
router.get('/followed', authenticateToken, checkRole(['participant']), getFollowedEvents);

// Parameterized routes (must be last)
router.get('/:id/calendar', getEventCalendar);
router.get('/:id', getEventDetails);

// Base route - optionalAuth to boost results by participant preferences
router.get('/', optionalAuth, browseEvents);

module.exports = router;
