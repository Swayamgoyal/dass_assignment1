const express = require('express');
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    registerForEvent,
    getRegistrationByTicket,
    cancelRegistration
} = require('../controllers/registrationController');

// Protected registration routes (require participant auth)
const protectedRouter = express.Router();
protectedRouter.use(authenticateToken);
protectedRouter.use(checkRole(['participant']));

protectedRouter.post('/register', registerForEvent);
protectedRouter.delete('/:id', cancelRegistration);

// Public routes (no authentication)
const publicRouter = express.Router();
publicRouter.get('/ticket/:ticketId', getRegistrationByTicket);

module.exports = {
    protectedRoutes: protectedRouter,
    publicRoutes: publicRouter
};
