const TeamMessage = require('../models/TeamMessage');
const Team = require('../models/Team');

/**
 * Get message history for a team
 * GET /api/chat/:teamId/messages
 */
const getMessages = async (req, res) => {
    try {
        const { teamId } = req.params;
        const participantId = req.user.userId;
        const { before, limit = 50 } = req.query;

        // Verify user is a member of the team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const isMember = team.members.some(
            m => m.participantId.toString() === participantId && m.status === 'accepted'
        );
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'You are not a member of this team' });
        }

        // Build query
        const query = { teamId };
        if (before) {
            query.timestamp = { $lt: new Date(before) };
        }

        const messages = await TeamMessage.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        // Return in chronological order
        messages.reverse();

        res.status(200).json({
            success: true,
            data: messages,
            teamName: team.teamName
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

module.exports = {
    getMessages
};
