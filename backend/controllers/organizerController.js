const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest'); // Phase 8
const bcrypt = require('bcrypt');
const axios = require('axios');
const { Parser } = require('json2csv');
const { verifyQRCode } = require('../utils/qrGenerator');

// Phase 3: Get organizer profile
const getProfile = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const organizer = await Organizer.findById(organizerId);

        if (!organizer) {
            return res.status(404).json({ success: false, message: 'Organizer not found' });
        }

        res.status(200).json({ success: true, data: organizer });
    } catch (error) {
        console.error('Get organizer profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
};

// Phase 3: Update organizer profile
const updateProfile = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const { organizerName, category, description, contactEmail, contactNumber, discordWebhook } = req.body;

        const updateData = {};
        if (organizerName) updateData.organizerName = organizerName;
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (contactEmail) updateData.contactEmail = contactEmail;
        if (contactNumber) updateData.contactNumber = contactNumber;
        if (discordWebhook !== undefined) updateData.discordWebhook = discordWebhook;

        const organizer = await Organizer.findByIdAndUpdate(organizerId, updateData, { new: true, runValidators: true });

        res.status(200).json({ success: true, message: 'Profile updated successfully', data: organizer });
    } catch (error) {
        console.error('Update organizer profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};

// Phase 3: Change password
const changePassword = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
        }

        const organizer = await Organizer.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ success: false, message: 'Organizer not found' });
        }

        const isPasswordValid = await organizer.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        organizer.password = newPassword;
        await organizer.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
    }
};

// Phase 3: Test Discord webhook
const testWebhook = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const organizer = await Organizer.findById(organizerId);

        if (!organizer || !organizer.discordWebhook) {
            return res.status(400).json({ success: false, message: 'Discord webhook not configured' });
        }

        const message = {
            content: `🎉 **Webhook Test Successful!**`,
            embeds: [{
                title: 'Felicity Event Management System',
                description: `This is a test message from **${organizer.organizerName}**`,
                color: 5814783,
                timestamp: new Date().toISOString(),
                footer: { text: 'Felicity Event Management' }
            }]
        };

        await axios.post(organizer.discordWebhook, message);
        res.status(200).json({ success: true, message: 'Test message sent to Discord successfully' });
    } catch (error) {
        console.error('Test webhook error:', error);
        res.status(500).json({ success: false, message: 'Failed to send test message. Please check your webhook URL.', error: error.response?.data?.message || error.message });
    }
};

// Phase 6: Get dashboard data
const getDashboard = async (req, res) => {
    try {
        const organizerId = req.user.userId;

        const events = await Event.find({ organizerId });

        const totalEvents = events.length;
        const publishedEvents = events.filter(e => e.status === 'Published').length;
        const ongoingEvents = events.filter(e => e.status === 'Ongoing').length;
        const completedEvents = events.filter(e => e.status === 'Completed').length;

        const eventIds = events.map(e => e._id);
        const registrations = await Registration.find({ eventId: { $in: eventIds } });

        const totalRegistrations = registrations.length;

        // Calculate per-event revenue
        const perEventRevenue = {};
        let totalRevenue = 0;
        registrations
            .filter(r => r.status === 'Active')
            .forEach(r => {
                const evId = r.eventId.toString();
                if (!perEventRevenue[evId]) perEventRevenue[evId] = 0;
                let amount = 0;
                if (r.registrationType === 'Normal') {
                    const event = events.find(e => e._id.toString() === evId);
                    amount = event?.registrationFee || 0;
                } else if (r.registrationType === 'Merchandise') {
                    amount = (r.merchandiseVariant?.price || 0) * (r.merchandiseVariant?.quantity || 1);
                } else if (r.registrationType === 'MerchRegOnly') {
                    const event = events.find(e => e._id.toString() === evId);
                    amount = event?.merchandiseDetails?.registrationOnlyFee || 0;
                }
                perEventRevenue[evId] += amount;
                totalRevenue += amount;
            });

        const recentRegistrations = await Registration.find({ eventId: { $in: eventIds } })
            .sort({ registeredAt: -1 })
            .limit(10)
            .populate('participantId', 'firstName lastName email')
            .populate('eventId', 'eventName eventType');

        res.json({
            success: true,
            data: {
                stats: {
                    totalEvents,
                    publishedEvents,
                    ongoingEvents,
                    completedEvents,
                    totalRegistrations,
                    totalRevenue
                },
                perEventRevenue,
                recentRegistrations
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Get event registrations
const getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { search, status, type } = req.query;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to event' });
        }

        let query = { eventId };
        if (status) query.status = status;
        if (type) query.registrationType = type;

        let registrations = await Registration.find(query)
            .populate('participantId', 'firstName lastName email collegeId iiitEmail')
            .populate('eventId', 'eventName eventType registrationFee')
            .populate({ path: 'teamId', select: 'teamName' })
            .sort({ registeredAt: -1 });

        if (search) {
            const searchLower = search.toLowerCase();
            registrations = registrations.filter(reg => {
                const participant = reg.participantId;
                return (
                    participant?.firstName?.toLowerCase().includes(searchLower) ||
                    participant?.lastName?.toLowerCase().includes(searchLower) ||
                    participant?.email?.toLowerCase().includes(searchLower) ||
                    reg.ticketId?.toLowerCase().includes(searchLower)
                );
            });
        }

        res.json({ success: true, data: registrations });
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Approve registration
const approveRegistration = async (req, res) => {
    try {
        const { eventId, regId } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const registration = await Registration.findOneAndUpdate(
            { _id: regId, eventId, status: 'Pending' },
            { status: 'Active' },
            { new: true }
        ).populate('participantId', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found or not pending' });
        }

        res.json({ success: true, message: 'Registration approved', data: registration });
    } catch (error) {
        console.error('Approve registration error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Reject registration
const rejectRegistration = async (req, res) => {
    try {
        const { eventId, regId } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const registration = await Registration.findOneAndUpdate(
            { _id: regId, eventId, status: 'Pending' },
            { status: 'Rejected' },
            { new: true }
        ).populate('participantId', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found or not pending' });
        }

        res.json({ success: true, message: 'Registration rejected', data: registration });
    } catch (error) {
        console.error('Reject registration error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Mark attendance
const markAttendance = async (req, res) => {
    try {
        const { eventId, regId } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const registration = await Registration.findOneAndUpdate(
            { _id: regId, eventId, status: 'Active' },
            {
                'attendance.marked': true,
                'attendance.markedAt': new Date()
            },
            { new: true }
        ).populate('participantId', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found or not active' });
        }

        res.json({ success: true, message: 'Attendance marked successfully', data: registration });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Export registrations as CSV
const exportRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'firstName lastName email collegeId iiitEmail phone')
            .populate({ path: 'teamId', select: 'teamName' })
            .sort({ registeredAt: -1 });

        const csvData = registrations.map(reg => {
            let paymentAmount = 0;
            if (reg.status === 'Active') {
                if (reg.registrationType === 'Normal') paymentAmount = event.registrationFee || 0;
                else if (reg.registrationType === 'Merchandise' && reg.merchandiseVariant) paymentAmount = (reg.merchandiseVariant.price || 0) * (reg.merchandiseVariant.quantity || 1);
                else if (reg.registrationType === 'MerchRegOnly') paymentAmount = event.merchandiseDetails?.registrationOnlyFee || 0;
            }
            return {
                'Ticket ID': reg.ticketId,
                'First Name': reg.participantId?.firstName || 'N/A',
                'Last Name': reg.participantId?.lastName || 'N/A',
                'Email': reg.participantId?.email || 'N/A',
                'IIIT Email': reg.participantId?.iiitEmail || 'N/A',
                'College ID': reg.participantId?.collegeId || 'N/A',
                'Phone': reg.participantId?.phone || 'N/A',
                'Registration Type': reg.registrationType,
                'Registration Date': new Date(reg.registeredAt).toLocaleString(),
                'Status': reg.status,
                'Payment Amount': paymentAmount,
                'Payment Status': reg.paymentStatus || 'N/A',
                'Team': reg.teamId?.teamName || 'N/A',
                'Attendance': reg.attendance?.marked ? 'Present' : 'Absent',
                'Attendance Time': reg.attendance?.markedAt ? new Date(reg.attendance.markedAt).toLocaleString() : 'N/A'
            };
        });

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${event.eventName.replace(/\s+/g, '-')}-registrations.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Scan QR code
const scanQRCode = async (req, res) => {
    try {
        const { qrData } = req.body;
        const organizerId = req.user.userId;

        console.log('Scan attempt:', { qrData, organizerId });

        if (!qrData) {
            return res.status(400).json({ success: false, message: 'QR code data is required' });
        }

        // Try to parse as JSON (QR code scan) or use as plain ticket ID (manual entry)
        let ticketId;
        try {
            const decoded = verifyQRCode(qrData);
            ticketId = decoded.ticketId;
            console.log('Parsed ticketId from QR JSON:', ticketId);
        } catch {
            // If not JSON, assume it's a plain ticket ID from manual entry
            ticketId = qrData.trim();
            console.log('Using plain ticketId:', ticketId);
        }

        if (!ticketId) {
            return res.status(400).json({ success: false, message: 'Invalid ticket data' });
        }

        const registration = await Registration.findOne({ ticketId })
            .populate('participantId', 'firstName lastName email collegeId')
            .populate('eventId', 'eventName organizerId');

        console.log('Registration found:', !!registration);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        console.log('Event organizer:', registration.eventId.organizerId.toString(), 'Scanner organizer:', organizerId);

        if (registration.eventId.organizerId.toString() !== organizerId) {
            return res.status(403).json({ success: false, message: 'This ticket does not belong to your event' });
        }

        if (registration.attendance?.marked) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked',
                data: {
                    participant: registration.participantId,
                    markedAt: registration.attendance.markedAt
                }
            });
        }

        registration.attendance = {
            marked: true,
            markedAt: new Date()
        };
        await registration.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                participant: registration.participantId,
                event: registration.eventId.eventName,
                ticketId: registration.ticketId,
                markedAt: registration.attendance.markedAt
            }
        });
    } catch (error) {
        console.error('Scan QR error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Phase 6: Get event analytics
const getEventAnalytics = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'firstName lastName email participantType collegeOrganization contactNumber')
            .populate({ path: 'teamId', select: 'teamName members' });

        const totalRegistrations = registrations.length;
        const activeRegistrations = registrations.filter(r => r.status === 'Active').length;
        const cancelledRegistrations = registrations.filter(r => r.status === 'Cancelled').length;
        const rejectedRegistrations = registrations.filter(r => r.status === 'Rejected').length;
        const attendanceMarked = registrations.filter(r => r.attendance?.marked).length;
        const attendanceRate = activeRegistrations > 0 ? ((attendanceMarked / activeRegistrations) * 100).toFixed(2) : 0;

        let totalRevenue = 0;
        let merchPurchaseCount = 0;
        let merchRegOnlyCount = 0;
        let merchRevenue = 0;
        let regOnlyRevenue = 0;
        registrations.forEach(reg => {
            if (reg.status === 'Active') {
                if (reg.registrationType === 'Normal') {
                    totalRevenue += (event.registrationFee || 0);
                } else if (reg.registrationType === 'Merchandise' && reg.merchandiseVariant) {
                    const amount = (reg.merchandiseVariant.price || 0) * (reg.merchandiseVariant.quantity || 1);
                    totalRevenue += amount;
                    merchRevenue += amount;
                    merchPurchaseCount += 1;
                } else if (reg.registrationType === 'MerchRegOnly') {
                    const fee = event.merchandiseDetails?.registrationOnlyFee || 0;
                    totalRevenue += fee;
                    regOnlyRevenue += fee;
                    merchRegOnlyCount += 1;
                }
            }
        });

        // Detect IIIT students by checking if email ends with iiit.ac.in
        const iiitParticipants = registrations.filter(r => {
            const participant = r.participantId;
            if (!participant) return false;
            // Check participantType field first, then fallback to email domain check
            if (participant.participantType === 'IIIT') return true;
            if (participant.email && participant.email.toLowerCase().endsWith('iiit.ac.in')) return true;
            return false;
        }).length;
        const nonIiitParticipants = totalRegistrations - iiitParticipants;

        const timeline = {};
        registrations.forEach(reg => {
            const date = new Date(reg.registeredAt).toLocaleDateString();
            timeline[date] = (timeline[date] || 0) + 1;
        });
        const registrationTimeline = Object.keys(timeline).map(date => ({
            date,
            count: timeline[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        let merchandiseBreakdown = null;
        if (event.eventType === 'Merchandise') {
            const variantStats = {};
            registrations.forEach(reg => {
                if (reg.merchandiseVariant) {
                    const key = `${reg.merchandiseVariant.size}-${reg.merchandiseVariant.color}`;
                    if (!variantStats[key]) {
                        variantStats[key] = {
                            size: reg.merchandiseVariant.size,
                            color: reg.merchandiseVariant.color,
                            count: 0,
                            revenue: 0
                        };
                    }
                    variantStats[key].count += (reg.merchandiseVariant.quantity || 1);
                    variantStats[key].revenue += ((reg.merchandiseVariant.price || 0) * (reg.merchandiseVariant.quantity || 1));
                }
            });
            merchandiseBreakdown = Object.values(variantStats);
        }

        // Calculate additional stats
        const avgRevenuePerRegistration = activeRegistrations > 0 ? (totalRevenue / activeRegistrations).toFixed(2) : 0;
        const fillRate = event.registrationLimit ? ((totalRegistrations / event.registrationLimit) * 100).toFixed(1) : null;

        // Team completion stats
        let teamCompletion = null;
        if (event.isTeamEvent) {
            const teamRegs = registrations.filter(r => r.teamId);
            const uniqueTeams = new Set(teamRegs.map(r => r.teamId?._id?.toString()).filter(Boolean));
            const completeTeams = teamRegs.filter(r => r.teamId && r.teamId.members && r.teamId.members.length >= (event.maxTeamSize || 1));
            const uniqueCompleteTeams = new Set(completeTeams.map(r => r.teamId._id.toString()));
            teamCompletion = {
                totalTeams: uniqueTeams.size,
                completeTeams: uniqueCompleteTeams.size,
                incompleteTeams: uniqueTeams.size - uniqueCompleteTeams.size,
                maxTeamSize: event.maxTeamSize
            };
        }

        res.json({
            success: true,
            data: {
                eventInfo: {
                    eventName: event.eventName,
                    eventType: event.eventType,
                    status: event.status,
                    eligibility: event.eligibility,
                    registrationFee: event.registrationFee || 0,
                    registrationLimit: event.registrationLimit,
                    eventStartDate: event.eventStartDate,
                    eventEndDate: event.eventEndDate,
                    registrationDeadline: event.registrationDeadline,
                    isTeamEvent: event.isTeamEvent || false,
                    maxTeamSize: event.maxTeamSize || 1,
                    allowRegistrationOnly: event.merchandiseDetails?.allowRegistrationOnly || false,
                    registrationOnlyFee: event.merchandiseDetails?.registrationOnlyFee || 0
                },
                overview: {
                    totalRegistrations,
                    activeRegistrations,
                    cancelledRegistrations,
                    rejectedRegistrations,
                    totalRevenue,
                    attendanceMarked,
                    attendanceRate: parseFloat(attendanceRate),
                    avgRevenuePerRegistration: parseFloat(avgRevenuePerRegistration),
                    fillRate: fillRate ? parseFloat(fillRate) : null,
                    // Merchandise-specific stats
                    merchPurchaseCount,
                    merchRegOnlyCount,
                    merchRevenue,
                    regOnlyRevenue
                },
                demographics: {
                    iiitParticipants,
                    nonIiitParticipants
                },
                registrationTimeline,
                merchandiseBreakdown,
                teamCompletion
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * Phase 8: Request password reset
 * POST /api/organizer/password-reset-request
 */
const requestPasswordReset = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for password reset'
            });
        }

        // Check for existing pending request
        const existingRequest = await PasswordResetRequest.findOne({
            organizerId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending password reset request'
            });
        }

        const resetRequest = new PasswordResetRequest({
            organizerId,
            reason: reason.trim()
        });

        await resetRequest.save();

        res.status(201).json({
            success: true,
            message: 'Password reset request submitted successfully',
            data: resetRequest
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit password reset request',
            error: error.message
        });
    }
};

/**
 * Phase 8: Get my password reset requests
 * GET /api/organizer/password-reset-requests
 */
const getMyPasswordResetRequests = async (req, res) => {
    try {
        const organizerId = req.user.userId;

        const requests = await PasswordResetRequest.find({ organizerId })
            .sort({ requestedAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get password reset requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch password reset requests',
            error: error.message
        });
    }
};

module.exports = {
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
};
