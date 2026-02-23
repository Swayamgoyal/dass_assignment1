const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    getProfile,
    updateProfile,
    changePassword,
    testWebhook,
    getDashboard,
    getEventRegistrations,
    approveRegistration,
    rejectRegistration,
    markAttendance,
    exportRegistrations,
    scanQRCode,
    getEventAnalytics,
    requestPasswordReset,
    getMyPasswordResetRequests
} = require('../controllers/organizerController');

// All routes require organizer authentication
router.use(authenticateToken);
router.use(checkRole(['organizer']));

// Phase 3: Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/test-webhook', testWebhook);

// Phase 6: Dashboard
router.get('/dashboard', getDashboard);

// Phase 6: Event registrations management
router.get('/events/:eventId/registrations', getEventRegistrations);
router.patch('/events/:eventId/registrations/:regId/approve', approveRegistration);
router.patch('/events/:eventId/registrations/:regId/reject', rejectRegistration);
router.patch('/events/:eventId/registrations/:regId/attendance', markAttendance);

// Phase 6: CSV export
router.get('/events/:eventId/export', exportRegistrations);

// Phase 6: QR scanning
router.post('/scan-qr', scanQRCode);

// Phase 6: Analytics
router.get('/events/:eventId/analytics', getEventAnalytics);

// Phase 8: Password reset requests
router.post('/password-reset-request', requestPasswordReset);
router.get('/password-reset-requests', getMyPasswordResetRequests);

module.exports = router;

