const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const { getMessages } = require('../controllers/chatController');

// All routes require participant authentication
router.use(authenticateToken);
router.use(checkRole(['participant']));

// Get message history for a team
router.get('/:teamId/messages', getMessages);

module.exports = router;
