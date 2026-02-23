const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    createTeam,
    joinTeam,
    getMyTeams,
    getTeamDetails,
    getTeamsByEvent,
    leaveTeam,
    deleteTeam
} = require('../controllers/teamController');

// All routes require authentication
router.use(authenticateToken);

// Participant team routes
router.post('/create', checkRole(['participant']), createTeam);
router.post('/join/:inviteCode', checkRole(['participant']), joinTeam);
router.get('/my-teams', checkRole(['participant']), getMyTeams);

// Organizer route to get teams for an event
router.get('/event/:eventId', checkRole(['organizer']), getTeamsByEvent);

// Team detail and management (participant)
router.get('/:id', checkRole(['participant']), getTeamDetails);
router.patch('/:id/leave', checkRole(['participant']), leaveTeam);
router.delete('/:id', checkRole(['participant']), deleteTeam);

module.exports = router;
