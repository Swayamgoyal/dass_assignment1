const QRCode = require('qrcode');

/**
 * Generate QR code for ticket
 * @param {string} ticketId - Unique ticket ID
 * @param {object} eventData - Event information
 * @param {object} participantData - Participant information
 * @returns {string} Base64 encoded QR code image
 */
const generateQRCode = async (ticketId, eventData, participantData) => {
    try {
        // Create QR code data payload
        const qrData = JSON.stringify({
            ticketId,
            eventId: eventData._id,
            eventName: eventData.eventName,
            participantId: participantData._id,
            participantName: `${participantData.firstName} ${participantData.lastName}`,
            timestamp: new Date().toISOString()
        });

        // Generate QR code as base64 string
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Verify QR code data
 * @param {string} qrData - Scanned QR code data
 * @returns {object} Parsed QR data
 */
const verifyQRCode = (qrData) => {
    try {
        return JSON.parse(qrData);
    } catch (error) {
        throw new Error('Invalid QR code data');
    }
};

module.exports = {
    generateQRCode,
    verifyQRCode
};
