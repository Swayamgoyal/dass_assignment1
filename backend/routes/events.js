const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    createEvent,
    getOrganizerEvents,
    getEventById,
    updateEvent,
    publishEvent,
    closeEvent,
    deleteEvent
} = require('../controllers/eventController');

// All routes require organizer authentication
router.use(authenticateToken);
router.use(checkRole(['organizer']));

// Event CRUD routes
router.post('/', createEvent);
router.get('/', getOrganizerEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

// Event status management
router.patch('/:id/publish', publishEvent);
router.patch('/:id/close', closeEvent);
router.patch('/:id/ongoing', require('../controllers/eventController').markOngoing);
router.patch('/:id/completed', require('../controllers/eventController').markCompleted);

module.exports = router;
