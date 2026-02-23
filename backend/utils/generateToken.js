const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {Object} payload - Data to encode in token (userId, email, role)
 * @param {String} expiresIn - Token expiration time (default: 7 days)
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn
    });
};

module.exports = generateToken;
