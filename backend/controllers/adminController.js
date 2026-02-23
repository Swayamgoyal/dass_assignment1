const Admin = require('../models/Admin');
const Organizer = require('../models/Organizer');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AuditLog = require('../models/AuditLog');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const adminController = {
    // ============ DASHBOARD ============
    getDashboard: async (req, res) => {
        try {
            const adminId = req.user.userId;

            // Count totals
            const totalParticipants = await Participant.countDocuments();
            const totalOrganizers = await Organizer.countDocuments();
            const totalEvents = await Event.countDocuments();
            const totalRegistrations = await Registration.countDocuments();

            // Count by status
            const activeOrganizers = await Organizer.countDocuments({ status: 'Active' });
            const pendingOrganizers = await Organizer.countDocuments({ status: 'Pending' });
            const suspendedOrganizers = await Organizer.countDocuments({ status: 'Suspended' });

            const publishedEvents = await Event.countDocuments({ status: 'Published' });
            const flaggedEvents = await Event.countDocuments({ flagged: true });

            // Calculate total revenue
            const registrations = await Registration.find({ status: 'Active' }).populate('eventId', 'registrationFee eventType');
            const totalRevenue = registrations.reduce((sum, reg) => {
                if (reg.registrationType === 'Normal') {
                    return sum + (reg.eventId?.registrationFee || 0);
                } else {
                    return sum + ((reg.merchandiseVariant?.price || 0) * (reg.merchandiseVariant?.quantity || 1));
                }
            }, 0);

            // Recent organizers (last 10)
            const recentOrganizers = await Organizer.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('organizerName category contactEmail status createdAt');

            // Recent events (last 10)
            const recentEvents = await Event.find()
                .populate('organizerId', 'organizerName')
                .sort({ createdAt: -1 })
                .limit(10)
                .select('eventName eventType status flagged createdAt organizerId');

            // Recent registrations (last 10)
            const recentRegistrations = await Registration.find()
                .populate('participantId', 'firstName lastName email')
                .populate('eventId', 'eventName')
                .sort({ registeredAt: -1 })
                .limit(10);

            res.json({
                success: true,
                data: {
                    stats: {
                        totalParticipants,
                        totalOrganizers,
                        totalEvents,
                        totalRegistrations,
                        totalRevenue,
                        activeOrganizers,
                        pendingOrganizers,
                        suspendedOrganizers,
                        publishedEvents,
                        flaggedEvents
                    },
                    recentOrganizers,
                    recentEvents,
                    recentRegistrations
                }
            });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    // ============ ORGANIZER MANAGEMENT ============
    getOrganizers: async (req, res) => {
        try {
            const { search, status, category } = req.query;

            let query = {};

            if (search) {
                query.$or = [
                    { organizerName: { $regex: search, $options: 'i' } },
                    { contactEmail: { $regex: search, $options: 'i' } },
                    { loginEmail: { $regex: search, $options: 'i' } }
                ];
            }

            if (status) query.status = status;
            if (category) query.category = category;

            const organizers = await Organizer.find(query)
                .select('-password')
                .sort({ createdAt: -1 });

            // Get event count for each organizer
            const organizersWithEvents = await Promise.all(
                organizers.map(async (org) => {
                    const eventCount = await Event.countDocuments({ organizerId: org._id });
                    return {
                        ...org.toObject(),
                        eventCount
                    };
                })
            );

            res.json({
                success: true,
                data: organizersWithEvents
            });
        } catch (error) {
            console.error('Get organizers error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    getOrganizerById: async (req, res) => {
        try {
            const { id } = req.params;

            const organizer = await Organizer.findById(id).select('-password');
            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }

            // Get organizer's events
            const events = await Event.find({ organizerId: id });
            const eventCount = events.length;
            const totalRegistrations = events.reduce((sum, event) => sum + event.currentRegistrations, 0);

            res.json({
                success: true,
                data: {
                    ...organizer.toObject(),
                    eventCount,
                    totalRegistrations,
                    events
                }
            });
        } catch (error) {
            console.error('Get organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    createOrganizer: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const {
                organizerName,
                category,
                description,
                contactEmail,
                loginEmail,
                password,
                contactNumber,
                discordWebhook,
                status
            } = req.body;

            // Validation
            if (!organizerName || !category || !contactEmail || !loginEmail || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Required fields: organizerName, category, contactEmail, loginEmail, password'
                });
            }

            // Check if email already exists
            const existingOrganizer = await Organizer.findOne({
                $or: [{ contactEmail }, { loginEmail }]
            });

            if (existingOrganizer) {
                return res.status(400).json({
                    success: false,
                    message: 'An organizer with this email already exists'
                });
            }

            // Create organizer
            const newOrganizer = new Organizer({
                organizerName,
                category,
                description,
                contactEmail,
                loginEmail,
                password, // Will be hashed by pre-save hook
                contactNumber,
                discordWebhook,
                status: status || 'Active',
                createdBy: adminId,
                approvedBy: adminId,
                approvedAt: new Date()
            });

            await newOrganizer.save();

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'CREATE_ORGANIZER',
                targetType: 'Organizer',
                targetId: newOrganizer._id,
                details: {
                    organizerName,
                    contactEmail,
                    loginEmail
                }
            });

            const organizerResponse = newOrganizer.toObject();
            delete organizerResponse.password;

            res.status(201).json({
                success: true,
                message: 'Organizer created successfully',
                data: organizerResponse
            });
        } catch (error) {
            console.error('Create organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    updateOrganizer: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;
            const {
                organizerName,
                category,
                description,
                contactEmail,
                contactNumber,
                discordWebhook
            } = req.body;

            const organizer = await Organizer.findById(id);
            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }

            const updateData = {};
            if (organizerName) updateData.organizerName = organizerName;
            if (category) updateData.category = category;
            if (description !== undefined) updateData.description = description;
            if (contactEmail) updateData.contactEmail = contactEmail;
            if (contactNumber) updateData.contactNumber = contactNumber;
            if (discordWebhook !== undefined) updateData.discordWebhook = discordWebhook;

            const updatedOrganizer = await Organizer.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'UPDATE_ORGANIZER',
                targetType: 'Organizer',
                targetId: id,
                details: updateData
            });

            res.json({
                success: true,
                message: 'Organizer updated successfully',
                data: updatedOrganizer
            });
        } catch (error) {
            console.error('Update organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    approveOrganizer: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;

            const organizer = await Organizer.findByIdAndUpdate(
                id,
                {
                    status: 'Active',
                    approvedBy: adminId,
                    approvedAt: new Date()
                },
                { new: true }
            ).select('-password');

            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'APPROVE_ORGANIZER',
                targetType: 'Organizer',
                targetId: id
            });

            res.json({
                success: true,
                message: 'Organizer approved successfully',
                data: organizer
            });
        } catch (error) {
            console.error('Approve organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    suspendOrganizer: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;
            const { reason } = req.body;

            const organizer = await Organizer.findByIdAndUpdate(
                id,
                {
                    status: 'Suspended',
                    suspendedBy: adminId,
                    suspendedAt: new Date(),
                    suspensionReason: reason || 'No reason provided'
                },
                { new: true }
            ).select('-password');

            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'SUSPEND_ORGANIZER',
                targetType: 'Organizer',
                targetId: id,
                details: { reason }
            });

            res.json({
                success: true,
                message: 'Organizer suspended successfully',
                data: organizer
            });
        } catch (error) {
            console.error('Suspend organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    unsuspendOrganizer: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;

            const organizer = await Organizer.findByIdAndUpdate(
                id,
                {
                    status: 'Active',
                    suspendedBy: null,
                    suspendedAt: null,
                    suspensionReason: null
                },
                { new: true }
            ).select('-password');

            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'UNSUSPEND_ORGANIZER',
                targetType: 'Organizer',
                targetId: id
            });

            res.json({
                success: true,
                message: 'Organizer unsuspended successfully',
                data: organizer
            });
        } catch (error) {
            console.error('Unsuspend organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    deleteOrganizer: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;

            // Check if organizer has events
            const eventCount = await Event.countDocuments({ organizerId: id });
            if (eventCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete organizer with ${eventCount} existing events. Please delete or reassign events first.`
                });
            }

            const organizer = await Organizer.findByIdAndDelete(id);
            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'DELETE_ORGANIZER',
                targetType: 'Organizer',
                targetId: id,
                details: {
                    organizerName: organizer.organizerName,
                    contactEmail: organizer.contactEmail
                }
            });

            res.json({
                success: true,
                message: 'Organizer deleted successfully'
            });
        } catch (error) {
            console.error('Delete organizer error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    // ============ EVENT MODERATION ============
    getAllEvents: async (req, res) => {
        try {
            const { search, status, eventType, flagged, organizerId } = req.query;

            let query = {};

            if (search) {
                query.eventName = { $regex: search, $options: 'i' };
            }

            if (status) query.status = status;
            if (eventType) query.eventType = eventType;
            if (flagged !== undefined) query.flagged = flagged === 'true';
            if (organizerId) query.organizerId = organizerId;

            const events = await Event.find(query)
                .populate('organizerId', 'organizerName category')
                .populate('flaggedBy', 'name email')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            console.error('Get all events error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    flagEvent: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;
            const { reason } = req.body;

            const event = await Event.findByIdAndUpdate(
                id,
                {
                    flagged: true,
                    flagReason: reason || 'No reason provided',
                    flaggedBy: adminId,
                    flaggedAt: new Date()
                },
                { new: true }
            ).populate('organizerId', 'organizerName');

            if (!event) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'FLAG_EVENT',
                targetType: 'Event',
                targetId: id,
                details: { reason, eventName: event.eventName }
            });

            res.json({
                success: true,
                message: 'Event flagged successfully',
                data: event
            });
        } catch (error) {
            console.error('Flag event error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    unflagEvent: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;

            const event = await Event.findByIdAndUpdate(
                id,
                {
                    flagged: false,
                    flagReason: null,
                    flaggedBy: null,
                    flaggedAt: null
                },
                { new: true }
            ).populate('organizerId', 'organizerName');

            if (!event) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'UNFLAG_EVENT',
                targetType: 'Event',
                targetId: id
            });

            res.json({
                success: true,
                message: 'Event unflagged successfully',
                data: event
            });
        } catch (error) {
            console.error('Unflag event error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    deleteEvent: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { id } = req.params;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            // Delete all registrations for this event
            await Registration.deleteMany({ eventId: id });

            // Delete event
            await Event.findByIdAndDelete(id);

            // Create audit log
            await AuditLog.create({
                adminId,
                action: 'DELETE_EVENT',
                targetType: 'Event',
                targetId: id,
                details: {
                    eventName: event.eventName,
                    organizerId: event.organizerId
                }
            });

            res.json({
                success: true,
                message: 'Event and all associated registrations deleted successfully'
            });
        } catch (error) {
            console.error('Delete event error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    // ============ SYSTEM ANALYTICS ============
    getSystemAnalytics: async (req, res) => {
        try {
            // User growth over time
            const participantGrowth = await Participant.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const organizerGrowth = await Organizer.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Events by category
            const eventsByCategory = await Event.aggregate([
                {
                    $lookup: {
                        from: 'organizers',
                        localField: 'organizerId',
                        foreignField: '_id',
                        as: 'organizer'
                    }
                },
                { $unwind: '$organizer' },
                {
                    $group: {
                        _id: '$organizer.category',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Events by month
            const eventsByMonth = await Event.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Revenue trends
            const registrations = await Registration.find({ status: 'Active' })
                .populate('eventId', 'registrationFee eventType');

            const revenueByMonth = {};
            registrations.forEach(reg => {
                const month = new Date(reg.registeredAt).toISOString().substring(0, 7);
                let revenue = 0;

                if (reg.registrationType === 'Normal' && reg.eventId) {
                    revenue = reg.eventId.registrationFee || 0;
                } else if (reg.merchandiseVariant) {
                    revenue = (reg.merchandiseVariant.price || 0) * (reg.merchandiseVariant.quantity || 1);
                }

                revenueByMonth[month] = (revenueByMonth[month] || 0) + revenue;
            });

            const revenueTrend = Object.keys(revenueByMonth).sort().map(month => ({
                month,
                revenue: revenueByMonth[month]
            }));

            // Top events
            const topEvents = await Event.find()
                .sort({ currentRegistrations: -1 })
                .limit(10)
                .populate('organizerId', 'organizerName')
                .select('eventName eventType currentRegistrations organizerId');

            // Top organizers
            const topOrganizers = await Event.aggregate([
                {
                    $group: {
                        _id: '$organizerId',
                        eventCount: { $sum: 1 },
                        totalRegistrations: { $sum: '$currentRegistrations' }
                    }
                },
                { $sort: { totalRegistrations: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'organizers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'organizer'
                    }
                },
                { $unwind: '$organizer' }
            ]);

            res.json({
                success: true,
                data: {
                    userGrowth: {
                        participants: participantGrowth,
                        organizers: organizerGrowth
                    },
                    eventTrends: {
                        byCategory: eventsByCategory,
                        byMonth: eventsByMonth
                    },
                    revenueTrend,
                    topPerformers: {
                        events: topEvents,
                        organizers: topOrganizers
                    }
                }
            });
        } catch (error) {
            console.error('System analytics error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    // ============ AUDIT LOGS ============
    getAuditLogs: async (req, res) => {
        try {
            const { action, targetType, limit = 50 } = req.query;

            let query = {};
            if (action) query.action = action;
            if (targetType) query.targetType = targetType;

            const logs = await AuditLog.find(query)
                .populate('adminId', 'name email')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    // ============ PASSWORD RESET REQUESTS ============
    getPasswordResetRequests: async (req, res) => {
        try {
            const { status } = req.query;
            let query = {};
            if (status) query.status = status;

            const requests = await PasswordResetRequest.find(query)
                .populate('organizerId', 'organizerName category contactEmail loginEmail')
                .populate('processedBy', 'name email')
                .sort({ requestedAt: -1 });

            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('Get password reset requests error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    approvePasswordReset: async (req, res) => {
        try {
            const { id } = req.params;
            const { adminComment } = req.body;
            const adminId = req.user.userId;

            const resetRequest = await PasswordResetRequest.findById(id).populate('organizerId', 'organizerName loginEmail');
            if (!resetRequest) {
                return res.status(404).json({ success: false, message: 'Reset request not found' });
            }
            if (resetRequest.status !== 'pending') {
                return res.status(400).json({ success: false, message: 'This request has already been processed' });
            }

            // Generate a new random password
            const newPassword = crypto.randomBytes(4).toString('hex'); // 8-char hex string

            // Update the organizer's password
            const organizer = await Organizer.findById(resetRequest.organizerId._id);
            if (!organizer) {
                return res.status(404).json({ success: false, message: 'Organizer not found' });
            }
            organizer.password = newPassword;
            await organizer.save();

            // Update the reset request
            resetRequest.status = 'approved';
            resetRequest.adminComment = adminComment || '';
            resetRequest.processedAt = new Date();
            resetRequest.processedBy = adminId;
            await resetRequest.save();

            // Log the action
            await AuditLog.create({
                adminId,
                action: 'password_reset_approved',
                targetType: 'Organizer',
                targetId: organizer._id,
                details: `Password reset approved for ${organizer.organizerName}`,
                previousState: {},
                newState: { resetRequestId: resetRequest._id }
            });

            res.json({
                success: true,
                message: 'Password reset approved',
                data: {
                    organizerName: resetRequest.organizerId.organizerName,
                    loginEmail: resetRequest.organizerId.loginEmail,
                    newPassword: newPassword
                }
            });
        } catch (error) {
            console.error('Approve password reset error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    },

    rejectPasswordReset: async (req, res) => {
        try {
            const { id } = req.params;
            const { adminComment } = req.body;
            const adminId = req.user.userId;

            const resetRequest = await PasswordResetRequest.findById(id).populate('organizerId', 'organizerName');
            if (!resetRequest) {
                return res.status(404).json({ success: false, message: 'Reset request not found' });
            }
            if (resetRequest.status !== 'pending') {
                return res.status(400).json({ success: false, message: 'This request has already been processed' });
            }

            resetRequest.status = 'rejected';
            resetRequest.adminComment = adminComment || '';
            resetRequest.processedAt = new Date();
            resetRequest.processedBy = adminId;
            await resetRequest.save();

            // Log the action
            await AuditLog.create({
                adminId,
                action: 'password_reset_rejected',
                targetType: 'Organizer',
                targetId: resetRequest.organizerId._id,
                details: `Password reset rejected for ${resetRequest.organizerId.organizerName}`,
                previousState: {},
                newState: { resetRequestId: resetRequest._id, reason: adminComment }
            });

            res.json({
                success: true,
                message: 'Password reset request rejected'
            });
        } catch (error) {
            console.error('Reject password reset error:', error);
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    }
};

module.exports = adminController;
