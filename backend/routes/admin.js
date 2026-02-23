const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(checkRole(['admin']));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Organizer Management
router.get('/organizers', adminController.getOrganizers);
router.get('/organizers/:id', adminController.getOrganizerById);
router.post('/organizers', adminController.createOrganizer);
router.patch('/organizers/:id', adminController.updateOrganizer);
router.patch('/organizers/:id/approve', adminController.approveOrganizer);
router.patch('/organizers/:id/suspend', adminController.suspendOrganizer);
router.patch('/organizers/:id/unsuspend', adminController.unsuspendOrganizer);
router.delete('/organizers/:id', adminController.deleteOrganizer);

// Event Moderation
router.get('/events', adminController.getAllEvents);
router.patch('/events/:id/flag', adminController.flagEvent);
router.patch('/events/:id/unflag', adminController.unflagEvent);
router.delete('/events/:id', adminController.deleteEvent);

// System Analytics
router.get('/analytics', adminController.getSystemAnalytics);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Password Reset Requests
router.get('/password-reset-requests', adminController.getPasswordResetRequests);
router.patch('/password-reset-requests/:id/approve', adminController.approvePasswordReset);
router.patch('/password-reset-requests/:id/reject', adminController.rejectPasswordReset);

module.exports = router;
