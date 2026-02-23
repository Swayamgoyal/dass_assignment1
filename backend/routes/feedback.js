const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    submitFeedback,
    getEventFeedback,
    getEventFeedbackStats
} = require('../controllers/feedbackController');

// Submit feedback (participant only, authenticated)
router.post('/', authenticateToken, checkRole(['participant']), submitFeedback);

// Get event feedback (organizer/admin)
router.get('/event/:eventId', authenticateToken, getEventFeedback);

// Get feedback stats (organizer/admin)
router.get('/event/:eventId/stats', authenticateToken, getEventFeedbackStats);

module.exports = router;
