const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const axios = require('axios');

/**
 * Create new event (Draft)
 * POST /api/organizer/events
 */
const createEvent = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const eventData = {
            ...req.body,
            organizerId,
            status: 'Draft'
        };

        // Auto-set isTeamEvent if maxTeamSize > 1
        if (eventData.maxTeamSize && eventData.maxTeamSize > 1) {
            eventData.isTeamEvent = true;
        }

        // Validate event type specific data
        if (eventData.eventType === 'Normal' && !eventData.customForm) {
            eventData.customForm = [];
        }

        if (eventData.eventType === 'Merchandise' && !eventData.merchandiseDetails) {
            return res.status(400).json({
                success: false,
                message: 'Merchandise details are required for Merchandise events'
            });
        }

        const event = await Event.create(eventData);

        res.status(201).json({
            success: true,
            message: 'Event created as draft',
            data: event
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error.message
        });
    }
};

/**
 * Get all events by organizer
 * GET /api/organizer/events
 */
const getOrganizerEvents = async (req, res) => {
    try {
        const organizerId = req.user.userId;
        const { status } = req.query;

        const filter = { organizerId };
        if (status) {
            filter.status = status;
        }

        const events = await Event.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Get organizer events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message
        });
    }
};

/**
 * Get single event by ID
 * GET /api/organizer/events/:id
 */
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: id, organizerId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error.message
        });
    }
};

/**
 * Update event (with editing rules)
 * PUT /api/organizer/events/:id
 */
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;
        const updates = req.body;

        const event = await Event.findOne({ _id: id, organizerId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Draft status: allow all updates
        if (event.status === 'Draft') {
            Object.assign(event, updates);
            
            // Auto-set isTeamEvent if maxTeamSize > 1
            if (event.maxTeamSize && event.maxTeamSize > 1) {
                event.isTeamEvent = true;
            } else if (event.maxTeamSize === 1) {
                event.isTeamEvent = false;
            }
            
            await event.save();

            return res.status(200).json({
                success: true,
                message: 'Event updated successfully',
                data: event
            });
        }

        // Published status: limited updates
        if (event.status === 'Published') {
            const allowedFields = ['eventDescription', 'eventTags', 'registrationDeadline', 'registrationLimit', 'eventEndDate'];
            const updateKeys = Object.keys(updates);

            // Allow updating merchandise stock and price for Merchandise events
            if (event.eventType === 'Merchandise' && updates.merchandiseDetails) {
                // Only allow updating stock and price, not structure
                if (updates.merchandiseDetails.variants) {
                    const existingVariants = event.merchandiseDetails.variants;
                    const updatedVariants = updates.merchandiseDetails.variants;
                    
                    // Ensure same number of variants (no adding/removing)
                    if (existingVariants.length !== updatedVariants.length) {
                        return res.status(400).json({
                            success: false,
                            message: 'Cannot add or remove merchandise variants after publishing'
                        });
                    }
                    
                    // Update only stock and price for each variant
                    existingVariants.forEach((variant, index) => {
                        if (updatedVariants[index]) {
                            variant.stock = updatedVariants[index].stock ?? variant.stock;
                            variant.price = updatedVariants[index].price ?? variant.price;
                        }
                    });
                }
                
                // Remove merchandiseDetails from updates to avoid the validation error
                delete updates.merchandiseDetails;
            }

            const invalidFields = updateKeys.filter(key => !allowedFields.includes(key) && key !== 'merchandiseDetails');
            if (invalidFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot update these fields after publishing: ${invalidFields.join(', ')}`
                });
            }

            // Only allow increasing limit, not decreasing
            if (updates.registrationLimit !== undefined && updates.registrationLimit !== null && event.registrationLimit !== null) {
                if (Number(updates.registrationLimit) < event.registrationLimit) {
                    return res.status(400).json({
                        success: false,
                        message: 'Can only increase the registration limit, not decrease it'
                    });
                }
            }

            // Check if form is locked
            if (event.formLocked && updates.customForm) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot modify form after first registration'
                });
            }

            Object.assign(event, updates);
            await event.save();

            return res.status(200).json({
                success: true,
                message: 'Event updated successfully',
                data: event
            });
        }

        // Ongoing/Completed/Closed: no edits
        return res.status(400).json({
            success: false,
            message: `Cannot edit event in ${event.status} status`
        });

    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: error.message
        });
    }
};

/**
 * Publish event (Draft → Published)
 * PATCH /api/organizer/events/:id/publish
 */
const publishEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: id, organizerId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft events can be published'
            });
        }

        // Validate required fields based on event type
        if (event.eventType === 'Merchandise') {
            if (!event.merchandiseDetails || !event.merchandiseDetails.variants || event.merchandiseDetails.variants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Merchandise events must have at least one variant'
                });
            }
        }

        event.status = 'Published';
        event.publishedAt = new Date();
        await event.save();

        // Send Discord notification if webhook is configured
        try {
            const organizer = await Organizer.findById(organizerId);
            if (organizer.discordWebhook) {
                await sendDiscordNotification(organizer, event);
            }
        } catch (webhookError) {
            console.error('Discord webhook error:', webhookError);
            // Don't fail the publish if webhook fails
        }

        res.status(200).json({
            success: true,
            message: 'Event published successfully',
            data: event
        });
    } catch (error) {
        console.error('Publish event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish event',
            error: error.message
        });
    }
};

/**
 * Close event registrations
 * PATCH /api/organizer/events/:id/close
 */
const closeEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: id, organizerId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!['Published', 'Ongoing', 'Completed'].includes(event.status)) {
            return res.status(400).json({
                success: false,
                message: 'Can only close Published, Ongoing, or Completed events'
            });
        }

        event.status = 'Closed';
        await event.save();

        res.status(200).json({
            success: true,
            message: 'Event closed successfully',
            data: event
        });
    } catch (error) {
        console.error('Close event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close event',
            error: error.message
        });
    }
};

/**
 * Delete event (Draft only)
 * DELETE /api/organizer/events/:id
 */
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: id, organizerId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.status !== 'Draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft events can be deleted'
            });
        }

        await Event.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message
        });
    }
};

/**
 * Helper: Send Discord notification
 */
const sendDiscordNotification = async (organizer, event) => {
    const message = {
        embeds: [{
            title: `🎉 New Event Published: ${event.eventName}`,
            description: event.eventDescription,
            color: 5814783, // Purple
            fields: [
                {
                    name: '📅 Event Dates',
                    value: `Start: ${new Date(event.eventStartDate).toLocaleDateString()}\nEnd: ${new Date(event.eventEndDate).toLocaleDateString()}`,
                    inline: true
                },
                {
                    name: '⏰ Registration Deadline',
                    value: new Date(event.registrationDeadline).toLocaleDateString(),
                    inline: true
                },
                {
                    name: '💰 Registration Fee',
                    value: event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free',
                    inline: true
                },
                {
                    name: '🎟️ Event Type',
                    value: event.eventType,
                    inline: true
                }
            ],
            footer: {
                text: `Organized by ${organizer.organizerName}`
            },
            timestamp: new Date().toISOString()
        }]
    };

    await axios.post(organizer.discordWebhook, message);
};

/**
 * Mark event as Ongoing
 * PATCH /api/organizer/events/:id/ongoing
 */
const markOngoing = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: id, organizerId });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.status !== 'Published') {
            return res.status(400).json({ success: false, message: 'Only Published events can be marked as Ongoing' });
        }

        event.status = 'Ongoing';
        await event.save();

        res.status(200).json({ success: true, message: 'Event marked as Ongoing', data: event });
    } catch (error) {
        console.error('Mark ongoing error:', error);
        res.status(500).json({ success: false, message: 'Failed to update event status', error: error.message });
    }
};

/**
 * Mark event as Completed
 * PATCH /api/organizer/events/:id/completed
 */
const markCompleted = async (req, res) => {
    try {
        const { id } = req.params;
        const organizerId = req.user.userId;

        const event = await Event.findOne({ _id: id, organizerId });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.status !== 'Ongoing' && event.status !== 'Published') {
            return res.status(400).json({ success: false, message: 'Only Published or Ongoing events can be marked as Completed' });
        }

        event.status = 'Completed';
        await event.save();

        res.status(200).json({ success: true, message: 'Event marked as Completed', data: event });
    } catch (error) {
        console.error('Mark completed error:', error);
        res.status(500).json({ success: false, message: 'Failed to update event status', error: error.message });
    }
};

module.exports = {
    createEvent,
    getOrganizerEvents,
    getEventById,
    updateEvent,
    publishEvent,
    closeEvent,
    deleteEvent,
    markOngoing,
    markCompleted
};
