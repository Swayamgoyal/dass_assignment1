const mongoose = require('mongoose');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const Organizer = require('../models/Organizer');
const bcrypt = require('bcrypt');

/**
 * Get participant dashboard data
 * GET /api/participant/dashboard
 */
const getDashboard = async (req, res) => {
    try {
        const participantId = req.user.userId;

        // Get upcoming events (registered, not yet ended)
        const now = new Date();
        const upcomingRegistrations = await Registration.find({
            participantId,
            status: 'Active'
        })
            .populate({
                path: 'eventId',
                match: { eventEndDate: { $gte: now } },
                populate: { path: 'organizerId', select: 'organizerName' }
            })
            .sort({ 'eventId.eventStartDate': 1 });

        // Filter out null events (where match failed)
        const upcomingEvents = upcomingRegistrations.filter(reg => reg.eventId !== null);

        // Get event IDs that already have registrations (to avoid duplicates)
        const registeredEventIds = new Set(
            upcomingEvents.map(reg => reg.eventId._id.toString())
        );

        // Also get team events where participant is a member
        const teamEvents = await Team.find({
            'members.participantId': participantId,
            'members.status': { $in: ['pending', 'accepted'] }
        })
            .populate({
                path: 'eventId',
                match: { eventEndDate: { $gte: now } },
                populate: { path: 'organizerId', select: 'organizerName' }
            })
            .sort({ createdAt: -1 });

        // Add team events to upcoming ONLY if not already registered
        // (Format them like registrations)
        const formattedTeamEvents = teamEvents
            .filter(team => team.eventId !== null)
            .filter(team => !registeredEventIds.has(team.eventId._id.toString()))
            .map(team => ({
                _id: team._id,
                eventId: team.eventId,
                registrationType: 'Team',
                teamId: team._id,
                teamName: team.teamName,
                registrationStatus: team.registrationStatus,
                status: 'Active'
            }));

        // Combine both lists (no duplicates now)
        const allUpcomingEvents = [...upcomingEvents, ...formattedTeamEvents];

        // Get stats
        const totalRegistrations = await Registration.countDocuments({
            participantId,
            status: 'Active'
        });

        const totalSpent = await Registration.aggregate([
            {
                $match: { participantId: new mongoose.Types.ObjectId(participantId), status: 'Active' }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: 'eventId',
                    foreignField: '_id',
                    as: 'event'
                }
            },
            {
                $unwind: '$event'
            },
            {
                $addFields: {
                    cost: {
                        $cond: {
                            if: { $eq: ['$registrationType', 'Merchandise'] },
                            then: {
                                $multiply: [
                                    { $ifNull: ['$merchandiseVariant.price', 0] },
                                    { $ifNull: ['$merchandiseVariant.quantity', 1] }
                                ]
                            },
                            else: { $ifNull: ['$event.registrationFee', 0] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$cost' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                upcomingEvents: allUpcomingEvents,
                stats: {
                    totalRegistrations,
                    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
                    upcomingCount: allUpcomingEvents.length
                }
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

/**
 * Get participation history
 * GET /api/participant/my-events
 */
const getMyEvents = async (req, res) => {
    try {
        const participantId = req.user.userId;
        const { type } = req.query;

        let filter = { participantId };

        // Filter by type if specified
        if (type) {
            if (type === 'Completed') {
                filter['attendance.marked'] = true;
            } else if (type === 'Cancelled') {
                filter.status = { $in: ['Cancelled', 'Rejected'] };
            } else {
                filter.registrationType = type;
                filter.status = 'Active';
            }
        }

        const registrations = await Registration.find(filter)
            .populate({
                path: 'eventId',
                populate: { path: 'organizerId', select: 'organizerName' }
            })
            .populate({
                path: 'teamId',
                select: 'teamName'
            })
            .sort({ registeredAt: -1 });

        res.status(200).json({
            success: true,
            data: registrations
        });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch participation history',
            error: error.message
        });
    }
};

/**
 * Get participant profile
 * GET /api/participant/profile
 */
const getProfile = async (req, res) => {
    try {
        const participantId = req.user.userId;

        const participant = await Participant.findById(participantId)
            .populate('followedClubs', 'organizerName category description');

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        res.status(200).json({
            success: true,
            data: participant
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

/**
 * Update participant profile
 * PUT /api/participant/profile
 */
const updateProfile = async (req, res) => {
    try {
        const participantId = req.user.userId;
        const {
            firstName,
            lastName,
            contactNumber,
            collegeOrganization,
            areasOfInterest
        } = req.body;

        // Only update allowed fields
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (contactNumber) updateData.contactNumber = contactNumber;
        if (collegeOrganization) updateData.collegeOrganization = collegeOrganization;
        if (areasOfInterest) updateData.areasOfInterest = areasOfInterest;

        const participant = await Participant.findByIdAndUpdate(
            participantId,
            updateData,
            { new: true, runValidators: true }
        ).populate('followedClubs', 'organizerName category description');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: participant
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

/**
 * Toggle follow/unfollow organizer
 * POST /api/participant/follow/:organizerId
 */
const toggleFollowOrganizer = async (req, res) => {
    try {
        const participantId = req.user.userId;
        const { organizerId } = req.params;

        const participant = await Participant.findById(participantId);

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        const isFollowing = participant.followedClubs.includes(organizerId);

        if (isFollowing) {
            // Unfollow
            participant.followedClubs = participant.followedClubs.filter(
                id => id.toString() !== organizerId
            );
        } else {
            // Follow
            participant.followedClubs.push(organizerId);
        }

        await participant.save();
        await participant.populate('followedClubs', 'organizerName category description');

        res.status(200).json({
            success: true,
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            data: {
                followedClubs: participant.followedClubs,
                isFollowing: !isFollowing
            }
        });
    } catch (error) {
        console.error('Toggle follow error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle follow status',
            error: error.message
        });
    }
};

/**
 * Change password
 * POST /api/participant/change-password
 */
const changePassword = async (req, res) => {
    try {
        const participantId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const participant = await Participant.findById(participantId);

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        // Verify current password
        const isPasswordValid = await participant.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password (will be hashed by pre-save hook)
        participant.password = newPassword;
        await participant.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getMyEvents,
    getProfile,
    updateProfile,
    toggleFollowOrganizer,
    changePassword
};
