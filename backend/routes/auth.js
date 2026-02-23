const express = require('express');
const router = express.Router();
const {
    registerParticipant,
    loginParticipant,
    loginOrganizer,
    loginAdmin,
    logout
} = require('../controllers/authController');

// Participant routes
router.post('/register/participant', registerParticipant);
router.post('/login/participant', loginParticipant);

// Organizer routes
router.post('/login/organizer', loginOrganizer);

// Admin routes
router.post('/login/admin', loginAdmin);

// Logout route (all users)
router.post('/logout', logout);

module.exports = router;
