const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    getDashboard,
    getMyEvents,
    getProfile,
    updateProfile,
    toggleFollowOrganizer,
    changePassword
} = require('../controllers/participantController');

// All routes require participant authentication
router.use(authenticateToken);
router.use(checkRole(['participant']));

// Dashboard routes
router.get('/dashboard', getDashboard);
router.get('/my-events', getMyEvents);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/follow/:organizerId', toggleFollowOrganizer);
router.post('/change-password', changePassword);

module.exports = router;
