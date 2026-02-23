const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    getOnboardingData,
    completeOnboarding,
    skipOnboarding
} = require('../controllers/onboardingController');

// All routes require participant authentication
router.use(authenticateToken);
router.use(checkRole(['participant']));

// Onboarding routes
router.get('/data', getOnboardingData);
router.post('/complete', completeOnboarding);
router.post('/skip', skipOnboarding);

module.exports = router;
