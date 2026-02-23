const ical = require('ical-generator').default;

/**
 * Generate .ics calendar file for an event
 * @param {Object} event - Event data
 * @returns {String} - .ics file content
 */
const generateCalendarFile = (event) => {
    const calendar = ical({ name: 'Felicity Event' });

    calendar.createEvent({
        start: new Date(event.eventStartDate),
        end: new Date(event.eventEndDate),
        summary: event.eventName,
        description: event.eventDescription,
        location: 'IIIT Hyderabad',
        url: `${process.env.FRONTEND_URL}/events/${event._id}`,
        organizer: {
            name: event.organizerId?.organizerName || 'Felicity',
            email: event.organizerId?.contactEmail || 'events@felicity.iiit.ac.in'
        }
    });

    return calendar.toString();
};

/**
 * Generate Google Calendar URL for an event
 * @param {Object} event - Event data
 * @returns {String} - Google Calendar URL
 */
const generateGoogleCalendarUrl = (event) => {
    const startDate = new Date(event.eventStartDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(event.eventEndDate).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.eventName,
        details: event.eventDescription,
        location: 'IIIT Hyderabad',
        dates: `${startDate}/${endDate}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar URL for an event
 * @param {Object} event - Event data
 * @returns {String} - Outlook Calendar URL
 */
const generateOutlookCalendarUrl = (event) => {
    const startDate = new Date(event.eventStartDate).toISOString();
    const endDate = new Date(event.eventEndDate).toISOString();

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: event.eventName,
        body: event.eventDescription,
        location: 'IIIT Hyderabad',
        startdt: startDate,
        enddt: endDate
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

module.exports = {
    generateCalendarFile,
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl
};
