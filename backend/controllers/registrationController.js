const crypto = require('crypto');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Participant = require('../models/Participant');
const { generateQRCode } = require('../utils/qrGenerator');
const { sendRegistrationEmail } = require('../utils/emailService');

/**
 * Register for an event
 * POST /api/registrations
 */
const registerForEvent = async (req, res) => {
    try {
        const participantId = req.user.userId;
        const { eventId, formResponses, merchandiseVariant, registrationOnly } = req.body;

        // Get event details
        const event = await Event.findById(eventId).populate('organizerId');
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event is open for registration (Published or Ongoing)
        if (event.status !== 'Published' && event.status !== 'Ongoing') {
            return res.status(400).json({
                success: false,
                message: 'Event is not open for registration'
            });
        }

        // Check registration deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({
                success: false,
                message: 'Registration deadline has passed'
            });
        }

        // Check if already registered
        const existingRegistration = await Registration.findOne({
            eventId,
            participantId,
            status: 'Active'
        });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event'
            });
        }

        // Check registration limit
        if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
            return res.status(400).json({
                success: false,
                message: 'Registration limit reached'
            });
        }

        // Type-specific validation
        if (event.eventType === 'Normal') {
            // Validate custom form responses
            if (!formResponses) {
                return res.status(400).json({
                    success: false,
                    message: 'Form responses are required'
                });
            }

            // Check required fields
            const requiredFields = event.customForm.filter(field => field.isRequired);
            for (const field of requiredFields) {
                if (!formResponses[field.fieldId]) {
                    return res.status(400).json({
                        success: false,
                        message: `${field.fieldLabel} is required`
                    });
                }
            }
        } else if (event.eventType === 'Merchandise') {
            // Check if participant wants to register only (no merch purchase)
            if (registrationOnly) {
                // Verify the organizer has enabled registration-only mode
                if (!event.merchandiseDetails?.allowRegistrationOnly) {
                    return res.status(400).json({
                        success: false,
                        message: 'This merchandise event requires a purchase to register'
                    });
                }
                // Registration-only is valid - no variant validation needed
            } else {
                // Validate merchandise variant (buying merch)
                if (!merchandiseVariant || !merchandiseVariant.variantId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please select a variant or choose to register without purchase'
                    });
                }

                // Find variant and check stock
                const variant = event.merchandiseDetails.variants.find(
                    v => v.variantId === merchandiseVariant.variantId
                );

                if (!variant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid variant selected'
                    });
                }

                if (variant.stock < (merchandiseVariant.quantity || 1)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient stock'
                    });
                }

                // Check purchase limit
                const participantPurchases = await Registration.countDocuments({
                    eventId,
                    participantId,
                    registrationType: 'Merchandise',
                    status: 'Active'
                });

                if (participantPurchases >= event.merchandiseDetails.purchaseLimitPerParticipant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Purchase limit reached'
                    });
                }
            }
        }

        // Get participant details
        const participant = await Participant.findById(participantId);

        // Generate ticketId manually (same logic as pre-save hook)
        const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const ticketId = `FEL-${randomString}-${timestamp}`;

        // Generate QR code with the ticketId
        let qrCode = null;
        try {
            qrCode = await generateQRCode(ticketId, event, participant);
        } catch (qrError) {
            console.error('QR generation failed:', qrError);
            // Don't fail registration if QR fails
        }

        // Determine registration type
        let regType = event.eventType;
        if (event.eventType === 'Merchandise' && registrationOnly) {
            regType = 'MerchRegOnly';
        }

        // Create registration with pre-generated ticketId
        const registration = new Registration({
            eventId,
            participantId,
            registrationType: regType,
            ticketId,
            qrCode,
            formResponses: event.eventType === 'Normal' ? formResponses : undefined,
            merchandiseVariant: (event.eventType === 'Merchandise' && !registrationOnly) ? merchandiseVariant : undefined
        });

        await registration.save();

        // Update event registration count
        event.currentRegistrations += 1;

        // Lock form if first registration
        if (event.eventType === 'Normal' && event.currentRegistrations === 1) {
            event.formLocked = true;
        }

        // Decrement stock for merchandise (only if actually buying)
        if (event.eventType === 'Merchandise' && !registrationOnly) {
            const variant = event.merchandiseDetails.variants.find(
                v => v.variantId === merchandiseVariant.variantId
            );
            variant.stock -= (merchandiseVariant.quantity || 1);
        }

        await event.save();

        // Send confirmation email
        try {
            await sendRegistrationEmail(participant, event, registration);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                ticketId: registration.ticketId,
                registration
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register for event',
            error: error.message
        });
    }
};

/**
 * Get registration by ticket ID
 * GET /api/registrations/ticket/:ticketId
 */
const getRegistrationByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const registration = await Registration.findOne({ ticketId })
            .populate('eventId')
            .populate('participantId', 'firstName lastName email collegeOrganization');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.status(200).json({
            success: true,
            data: registration
        });
    } catch (error) {
        console.error('Get registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registration',
            error: error.message
        });
    }
};

/**
 * Cancel registration
 * DELETE /api/registrations/:id
 */
const cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.user.userId;

        const registration = await Registration.findOne({
            _id: id,
            participantId
        }).populate('eventId');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Check if event has started
        if (new Date() >= new Date(registration.eventId.eventStartDate)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel registration after event has started'
            });
        }

        // Update registration status
        registration.status = 'Cancelled';
        await registration.save();

        // Decrement event registration count
        const event = await Event.findById(registration.eventId);
        event.currentRegistrations -= 1;

        // Restore stock for merchandise (only if they actually bought merch)
        if (event.eventType === 'Merchandise' && registration.registrationType === 'Merchandise' && registration.merchandiseVariant) {
            const variant = event.merchandiseDetails.variants.find(
                v => v.variantId === registration.merchandiseVariant.variantId
            );
            if (variant) {
                variant.stock += (registration.merchandiseVariant.quantity || 1);
            }
        }

        await event.save();

        res.status(200).json({
            success: true,
            message: 'Registration cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel registration',
            error: error.message
        });
    }
};

/**
 * Send confirmation email
 */


module.exports = {
    registerForEvent,
    getRegistrationByTicket,
    cancelRegistration
};
