const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

/**
 * Submit feedback for an event
 * POST /api/feedback
 */
const submitFeedback = async (req, res) => {
    try {
        const { eventId, rating, comment } = req.body;
        const participantId = req.user.userId;

        // Check if participant attended the event
        const registration = await Registration.findOne({
            eventId,
            participantId,
            'attendance.marked': true
        });

        if (!registration) {
            return res.status(400).json({
                success: false,
                message: 'You can only submit feedback for events you attended'
            });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ eventId, participantId });
        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted feedback for this event'
            });
        }

        const feedback = new Feedback({
            eventId,
            participantId,
            rating,
            comment,
            isAnonymous: true
        });

        await feedback.save();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

/**
 * Get feedback for an event (organizer view - anonymized)
 * GET /api/feedback/event/:eventId
 */
const getEventFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;

        const feedbacks = await Feedback.find({ eventId })
            .select('-participantId') // Exclude participant ID for anonymity
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            data: feedbacks
        });
    } catch (error) {
        console.error('Get event feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback',
            error: error.message
        });
    }
};

/**
 * Get aggregated feedback stats for an event
 * GET /api/feedback/event/:eventId/stats
 */
const getEventFeedbackStats = async (req, res) => {
    try {
        const { eventId } = req.params;

        const feedbacks = await Feedback.find({ eventId });

        if (feedbacks.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalFeedbacks: 0,
                    averageRating: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                }
            });
        }

        // Calculate stats
        const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
        const averageRating = (totalRating / feedbacks.length).toFixed(2);

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedbacks.forEach(f => {
            ratingDistribution[f.rating]++;
        });

        res.status(200).json({
            success: true,
            data: {
                totalFeedbacks: feedbacks.length,
                averageRating: parseFloat(averageRating),
                ratingDistribution
            }
        });
    } catch (error) {
        console.error('Get feedback stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback stats',
            error: error.message
        });
    }
};

module.exports = {
    submitFeedback,
    getEventFeedback,
    getEventFeedbackStats
};
