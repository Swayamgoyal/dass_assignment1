const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Participant = require('../models/Participant');
const { generateQRCode } = require('../utils/qrGenerator');
// TEMPORARY: Comment out until ical-generator is installed
// const { generateCalendarFile, generateGoogleCalendarUrl, generateOutlookCalendarUrl } = require('../utils/calendarGenerator');

/**
 * Browse published events (public)
 * GET /api/events
 */
const browseEvents = async (req, res) => {
    try {
        const {
            search,
            type,
            organizer,
            tag,
            fee,
            eligibility,
            dateFrom,
            dateTo,
            followedOnly,
            sort = 'newest'
        } = req.query;

        // Base filter - published and ongoing events are visible to participants
        const filter = { status: { $in: ['Published', 'Ongoing'] } };

        // Event type filter
        if (type) {
            filter.eventType = type;
        }

        // Organizer filter
        if (organizer) {
            filter.organizerId = organizer;
        }

        // Tag filter
        if (tag) {
            filter.eventTags = tag;
        }

        // Fee filter
        if (fee === 'free') {
            filter.registrationFee = 0;
        } else if (fee === 'paid') {
            filter.registrationFee = { $gt: 0 };
        }

        // Eligibility filter
        if (eligibility) {
            filter.eligibility = { $regex: eligibility, $options: 'i' };
        }

        // Date range filter (on event start date)
        if (dateFrom || dateTo) {
            filter.eventStartDate = {};
            if (dateFrom) filter.eventStartDate.$gte = new Date(dateFrom);
            if (dateTo) filter.eventStartDate.$lte = new Date(dateTo);
        }

        // Followed clubs filter - restrict to followed organizers
        if (followedOnly === 'true' && req.user && req.user.role === 'participant') {
            const participant = await Participant.findById(req.user.userId).select('followedClubs').lean();
            if (participant && participant.followedClubs && participant.followedClubs.length > 0) {
                filter.organizerId = { $in: participant.followedClubs };
            } else {
                // No followed clubs, return empty
                return res.status(200).json({ success: true, data: [] });
            }
        }

        // Sorting
        let sortOption = {};
        switch (sort) {
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'deadline':
                sortOption = { registrationDeadline: 1 };
                break;
            case 'trending':
                sortOption = { viewCount: -1, currentRegistrations: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        let events = await Event.find(filter)
            .populate('organizerId', 'organizerName category')
            .sort(sortOption)
            .lean();

        // Post-query search: match on event name OR organizer name (with fuzzy tolerance)
        if (search) {
            const searchLower = search.toLowerCase();
            // Build a simple fuzzy matcher: allow 1-char difference for short terms, 2 for longer
            const fuzzyMatch = (text, term) => {
                if (!text) return false;
                const tLower = text.toLowerCase();
                // Exact substring match
                if (tLower.includes(term)) return true;
                // Simple fuzzy: check if any word in text starts with the search term
                const words = tLower.split(/\s+/);
                for (const word of words) {
                    if (word.startsWith(term.substring(0, Math.max(2, term.length - 1)))) return true;
                }
                return false;
            };
            events = events.filter(event =>
                fuzzyMatch(event.eventName, searchLower) ||
                fuzzyMatch(event.organizerId?.organizerName, searchLower)
            );
        }

        // Filter out events with closed registrations or past deadlines
        const now = new Date();
        const openEvents = events.filter(event => {
            const deadlinePassed = new Date(event.registrationDeadline) < now;
            const limitReached = event.registrationLimit && event.currentRegistrations >= event.registrationLimit;
            return !deadlinePassed && !limitReached;
        });

        // If logged-in participant, boost events matching their preferences
        if (req.user && req.user.role === 'participant') {
            try {
                const participant = await Participant.findById(req.user.userId).lean();
                if (participant) {
                    const interests = (participant.areasOfInterest || []).map(i => i.toLowerCase());
                    const followedIds = (participant.followedClubs || []).map(id => id.toString());

                    // Compute a relevance score for each event
                    openEvents.forEach(event => {
                        let score = 0;
                        // Check if any event tag matches participant interests
                        if (event.eventTags && interests.length > 0) {
                            for (const tag of event.eventTags) {
                                if (interests.includes(tag.toLowerCase())) {
                                    score += 2;
                                }
                            }
                        }
                        // Check if event is from a followed organizer
                        if (event.organizerId && followedIds.includes(event.organizerId._id.toString())) {
                            score += 3;
                        }
                        event._relevanceScore = score;
                    });

                    // Stable sort: higher relevance first, preserve existing order for ties
                    openEvents.sort((a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0));
                }
            } catch (err) {
                // If preference lookup fails, just return unsorted — not critical
                console.error('Preference boost error (non-fatal):', err.message);
            }
        }

        res.status(200).json({
            success: true,
            data: openEvents
        });
    } catch (error) {
        console.error('Browse events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message
        });
    }
};

/**
 * Get single event details (public)
 * GET /api/events/:id
 */
const getEventDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id)
            .populate('organizerId', 'organizerName category description contactEmail contactNumber');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Increment view count
        event.viewCount += 1;
        await event.save();

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Get event details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event details',
            error: error.message
        });
    }
};

/**
 * Get trending events
 * GET /api/events/trending
 */
const getTrendingEvents = async (req, res) => {
    try {
        // Get events from last 24 hours, sorted by registrations
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const trendingEvents = await Event.find({
            status: { $in: ['Published', 'Ongoing'] },
            publishedAt: { $gte: yesterday }
        })
            .populate('organizerId', 'organizerName category')
            .sort({ currentRegistrations: -1, viewCount: -1 })
            .limit(5)
            .lean();

        res.status(200).json({
            success: true,
            data: trendingEvents
        });
    } catch (error) {
        console.error('Get trending events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending events',
            error: error.message
        });
    }
};

/**
 * Get events by followed organizers
 * GET /api/events/followed
 */
const getFollowedEvents = async (req, res) => {
    try {
        const participantId = req.user.userId;

        const participant = await Participant.findById(participantId);
        if (!participant || !participant.followedClubs || participant.followedClubs.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const events = await Event.find({
            status: { $in: ['Published', 'Ongoing'] },
            organizerId: { $in: participant.followedClubs }
        })
            .populate('organizerId', 'organizerName category')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Get followed events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events from followed clubs',
            error: error.message
        });
    }
};

/**
 * Get event calendar export data
 * GET /api/public-events/:id/calendar
 */
const getEventCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const { format } = req.query; // 'ics', 'google', 'outlook'

        const event = await Event.findById(id)
            .populate('organizerId', 'organizerName contactEmail');

        if (!event || (event.status !== 'Published' && event.status !== 'Ongoing')) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Try to load calendar generator, return error if not installed
        let calendarGenerator;
        try {
            calendarGenerator = require('../utils/calendarGenerator');
        } catch (e) {
            return res.status(501).json({
                success: false,
                message: 'Calendar export is not available. Install ical-generator package.'
            });
        }

        if (format === 'google') {
            const googleUrl = calendarGenerator.generateGoogleCalendarUrl(event);
            return res.status(200).json({
                success: true,
                url: googleUrl
            });
        }

        if (format === 'outlook') {
            const outlookUrl = calendarGenerator.generateOutlookCalendarUrl(event);
            return res.status(200).json({
                success: true,
                url: outlookUrl
            });
        }

        // Default: return .ics file
        const icsContent = calendarGenerator.generateCalendarFile(event);
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}.ics"`);
        res.status(200).send(icsContent);

    } catch (error) {
        console.error('Get event calendar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate calendar export',
            error: error.message
        });
    }
};

module.exports = {
    browseEvents,
    getEventDetails,
    getTrendingEvents,
    getFollowedEvents,
    getEventCalendar
};
