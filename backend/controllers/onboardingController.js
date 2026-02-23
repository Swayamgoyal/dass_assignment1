const Participant = require('../models/Participant');
const Organizer = require('../models/Organizer');

/**
 * Get onboarding data (interests and organizers)
 * GET /api/participant/onboarding/data
 */
const getOnboardingData = async (req, res) => {
    try {
        // Predefined areas of interest
        const areasOfInterest = [
            { category: 'Technical', items: ['Coding', 'Robotics', 'AI/ML', 'Web Development', 'Cybersecurity'] },
            { category: 'Cultural', items: ['Music', 'Dance', 'Drama', 'Art', 'Photography'] },
            { category: 'Sports', items: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Athletics'] },
            { category: 'Management', items: ['Entrepreneurship', 'Marketing', 'Finance', 'Case Study'] }
        ];

        // Get all active organizers
        const organizers = await Organizer.find({ isActive: true })
            .select('organizerName category description')
            .sort({ organizerName: 1 });

        res.status(200).json({
            success: true,
            data: {
                areasOfInterest,
                organizers
            }
        });
    } catch (error) {
        console.error('Get onboarding data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch onboarding data',
            error: error.message
        });
    }
};

/**
 * Complete onboarding with preferences
 * POST /api/participant/onboarding/complete
 */
const completeOnboarding = async (req, res) => {
    try {
        const { areasOfInterest, followedClubs } = req.body;
        const participantId = req.user.userId;

        const participant = await Participant.findByIdAndUpdate(
            participantId,
            {
                areasOfInterest: areasOfInterest || [],
                followedClubs: followedClubs || [],
                onboardingCompleted: true
            },
            { new: true }
        ).populate('followedClubs', 'organizerName category');

        res.status(200).json({
            success: true,
            message: 'Onboarding completed successfully',
            user: participant
        });
    } catch (error) {
        console.error('Complete onboarding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete onboarding',
            error: error.message
        });
    }
};

/**
 * Skip onboarding
 * POST /api/participant/onboarding/skip
 */
const skipOnboarding = async (req, res) => {
    try {
        const participantId = req.user.userId;

        const participant = await Participant.findByIdAndUpdate(
            participantId,
            { onboardingCompleted: true },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Onboarding skipped',
            user: participant
        });
    } catch (error) {
        console.error('Skip onboarding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to skip onboarding',
            error: error.message
        });
    }
};

module.exports = {
    getOnboardingData,
    completeOnboarding,
    skipOnboarding
};
