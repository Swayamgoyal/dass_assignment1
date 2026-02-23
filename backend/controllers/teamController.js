const Team = require('../models/Team');
const Event = require('../models/Event');
const Participant = require('../models/Participant');
const Registration = require('../models/Registration');
const { generateQRCode } = require('../utils/qrGenerator');
const crypto = require('crypto');

/**
 * Create a new team
 * POST /api/teams/create
 */
const createTeam = async (req, res) => {
    try {
        const { eventId, teamName, teamSize } = req.body;
        const participantId = req.user.userId;

        console.log('=== CREATE TEAM REQUEST ===');
        console.log('Event ID:', eventId);
        console.log('Team Name:', teamName);
        console.log('Team Size:', teamSize);
        console.log('Participant ID:', participantId);

        // Verify event exists and is a team event
        const event = await Event.findById(eventId);
        console.log('Event found:', event ? 'YES' : 'NO');
        if (event) {
            console.log('Event details:', {
                name: event.eventName,
                isTeamEvent: event.isTeamEvent,
                maxTeamSize: event.maxTeamSize
            });
        }

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event supports team registration (either isTeamEvent flag or maxTeamSize > 1)
        if (!event.isTeamEvent && (!event.maxTeamSize || event.maxTeamSize <= 1)) {
            console.log('❌ Event does not support teams');
            return res.status(400).json({
                success: false,
                message: `Event "${event.eventName}" does not support team registration. isTeamEvent=${event.isTeamEvent}, maxTeamSize=${event.maxTeamSize}`
            });
        }

        console.log('✅ Event supports teams');

        // Check if participant already has a team for this event
        const existingTeam = await Team.findOne({
            eventId,
            $or: [
                { teamLeaderId: participantId },
                { 'members.participantId': participantId }
            ]
        });

        if (existingTeam) {
            return res.status(400).json({
                success: false,
                message: 'You are already part of a team for this event'
            });
        }

        // Validate team size against event maxTeamSize
        const maxSize = event.maxTeamSize || 10;
        if (teamSize < 2 || teamSize > maxSize) {
            return res.status(400).json({
                success: false,
                message: `Team size must be between 2 and ${maxSize}`
            });
        }

        // Generate unique invite code
        const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create team
        const team = new Team({
            eventId,
            teamName,
            teamLeaderId: participantId,
            teamSize,
            inviteCode,
            members: [{ participantId, status: 'accepted' }]
        });

        await team.save();

        // Create registration for team leader immediately
        try {
            const participant = await Participant.findById(participantId);
            const registration = new Registration({
                eventId,
                participantId,
                teamId: team._id,
                registrationType: 'Normal',
                status: 'Active',
                paymentStatus: event.registrationFee > 0 ? 'Pending' : 'Completed'
            });
            await registration.save();

            // Generate QR code for the ticket
            try {
                const qrCode = await generateQRCode(
                    registration.ticketId,
                    event,
                    participant
                );
                registration.qrCode = qrCode;
                await registration.save();
            } catch (qrErr) {
                console.error('QR generation failed:', qrErr);
            }
        } catch (regErr) {
            console.error('Team leader registration error:', regErr);
        }

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: team
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create team',
            error: error.message
        });
    }
};

/**
 * Join a team via invite code
 * POST /api/teams/join/:inviteCode
 */
const joinTeam = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const participantId = req.user.userId;

        const team = await Team.findOne({ inviteCode }).populate('eventId');

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Invalid invite code'
            });
        }

        // Check if already in another team for this event
        const existingInOther = await Team.findOne({
            eventId: team.eventId._id,
            _id: { $ne: team._id },
            'members.participantId': participantId
        });
        if (existingInOther) {
            return res.status(400).json({
                success: false,
                message: 'You are already in another team for this event'
            });
        }

        // Check if team is full
        const acceptedMembers = team.members.filter(m => m.status === 'accepted');
        if (acceptedMembers.length >= team.teamSize) {
            return res.status(400).json({
                success: false,
                message: 'Team is full'
            });
        }

        // Check if already a member
        const existingMember = team.members.find(
            m => m.participantId.toString() === participantId
        );

        if (existingMember) {
            if (existingMember.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already a member of this team'
                });
            }
            existingMember.status = 'accepted';
        } else {
            team.members.push({
                participantId,
                status: 'accepted'
            });
        }

        // Check if team is now complete
        const currentAccepted = team.members.filter(m => m.status === 'accepted');
        if (currentAccepted.length === team.teamSize) {
            team.registrationStatus = 'complete';
        }

        await team.save();

        // Create registration for the new member immediately
        try {
            const event = team.eventId;
            const existing = await Registration.findOne({
                eventId: event._id,
                participantId: participantId,
                status: 'Active'
            });
            
            if (!existing) {
                const participant = await Participant.findById(participantId);
                const registration = new Registration({
                    eventId: event._id,
                    participantId: participantId,
                    teamId: team._id,
                    registrationType: 'Normal',
                    status: 'Active',
                    paymentStatus: event.registrationFee > 0 ? 'Pending' : 'Completed'
                });
                await registration.save();

                // Generate QR code for the ticket
                try {
                    const qrCode = await generateQRCode(
                        registration.ticketId,
                        event,
                        participant
                    );
                    registration.qrCode = qrCode;
                    await registration.save();
                } catch (qrErr) {
                    console.error('QR generation failed:', qrErr);
                }
            }
        } catch (regErr) {
            console.error('Member registration error:', regErr);
        }

        res.status(200).json({
            success: true,
            message: team.registrationStatus === 'complete'
                ? 'Team complete! All members are registered for the event.'
                : 'Successfully joined the team. You are now registered for the event.',
            data: team
        });
    } catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join team',
            error: error.message
        });
    }
};

/**
 * Get participant's teams
 * GET /api/teams/my-teams
 */
const getMyTeams = async (req, res) => {
    try {
        const participantId = req.user.userId;

        const teams = await Team.find({
            $or: [
                { teamLeaderId: participantId },
                { 'members.participantId': participantId }
            ]
        })
            .populate('eventId', 'eventName eventStartDate registrationDeadline isTeamEvent maxTeamSize')
            .populate('members.participantId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: teams
        });
    } catch (error) {
        console.error('Get my teams error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message
        });
    }
};

/**
 * Get team details
 * GET /api/teams/:id
 */
const getTeamDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const team = await Team.findById(id)
            .populate('eventId')
            .populate('teamLeaderId', 'firstName lastName email')
            .populate('members.participantId', 'firstName lastName email');

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Get team details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team details',
            error: error.message
        });
    }
};

/**
 * Get teams for a specific event (organizer view)
 * GET /api/teams/event/:eventId
 */
const getTeamsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const teams = await Team.find({ eventId })
            .populate('teamLeaderId', 'firstName lastName email')
            .populate('members.participantId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: teams,
            count: teams.length
        });
    } catch (error) {
        console.error('Get teams by event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message
        });
    }
};

/**
 * Leave team
 * PATCH /api/teams/:id/leave
 */
const leaveTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.user.userId;

        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        if (team.teamLeaderId.toString() === participantId) {
            return res.status(400).json({
                success: false,
                message: 'Team leader must delete the team'
            });
        }

        team.members = team.members.filter(
            m => m.participantId.toString() !== participantId
        );

        if (team.registrationStatus === 'complete') {
            team.registrationStatus = 'incomplete';
        }

        await team.save();

        // Cancel the member's registration if exists
        await Registration.findOneAndUpdate(
            { eventId: team.eventId, participantId, teamId: team._id, status: 'Active' },
            { status: 'Cancelled' }
        );

        res.status(200).json({
            success: true,
            message: 'Left team successfully'
        });
    } catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave team',
            error: error.message
        });
    }
};

/**
 * Delete team (leader only)
 * DELETE /api/teams/:id
 */
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.user.userId;

        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        if (team.teamLeaderId.toString() !== participantId) {
            return res.status(403).json({
                success: false,
                message: 'Only team leader can delete the team'
            });
        }

        // Cancel all team member registrations
        await Registration.updateMany(
            { teamId: team._id, status: 'Active' },
            { status: 'Cancelled' }
        );

        await team.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete team',
            error: error.message
        });
    }
};

module.exports = {
    createTeam,
    joinTeam,
    getMyTeams,
    getTeamDetails,
    getTeamsByEvent,
    leaveTeam,
    deleteTeam
};
