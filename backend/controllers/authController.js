const Participant = require('../models/Participant');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

/**
 * Register a new participant
 * POST /api/auth/register/participant
 */
const registerParticipant = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            participantType,
            collegeOrganization,
            contactNumber
        } = req.body;

        // Auto-detect IIIT status from email domain
        const iiitEmailPattern = /@(.+\.)?iiit\.ac\.in$/i;
        const isIiitEmail = iiitEmailPattern.test(email);

        // Determine participant type: if email ends with iiit.ac.in, force IIIT
        let resolvedParticipantType = participantType;
        if (isIiitEmail) {
            resolvedParticipantType = 'IIIT';
        }

        // Validate: if user claims IIIT but email doesn't match, reject
        if (participantType === 'IIIT' && !isIiitEmail) {
            return res.status(400).json({
                success: false,
                message: 'IIIT participants must register with IIIT email domain (ending with iiit.ac.in)'
            });
        }

        // Validate: if email is IIIT domain but user selected Non-IIIT, auto-correct to IIIT
        if (isIiitEmail && participantType === 'Non-IIIT') {
            resolvedParticipantType = 'IIIT';
        }

        // Check if email already exists
        const existingParticipant = await Participant.findOne({ email });
        if (existingParticipant) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new participant
        const participant = new Participant({
            firstName,
            lastName,
            email,
            password,
            participantType: resolvedParticipantType,
            collegeOrganization,
            contactNumber
        });

        await participant.save();

        // Generate JWT token
        const token = generateToken({
            userId: participant._id,
            email: participant.email,
            role: 'participant'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: participant
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

/**
 * Login participant
 * POST /api/auth/login/participant
 */
const loginParticipant = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find participant
        const participant = await Participant.findOne({ email });
        if (!participant) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await participant.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: participant._id,
            email: participant.email,
            role: 'participant'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: participant
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Login organizer
 * POST /api/auth/login/organizer
 */
const loginOrganizer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find organizer by login email
        const organizer = await Organizer.findOne({ loginEmail: email });
        if (!organizer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if organizer is active
        if (!organizer.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been disabled. Please contact admin.'
            });
        }

        // Check password
        const isPasswordValid = await organizer.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: organizer._id,
            email: organizer.loginEmail,
            role: 'organizer'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: organizer
        });
    } catch (error) {
        console.error('Organizer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Login admin
 * POST /api/auth/login/admin
 */
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: admin._id,
            email: admin.email,
            role: 'admin'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: admin
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
const logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};

module.exports = {
    registerParticipant,
    loginParticipant,
    loginOrganizer,
    loginAdmin,
    logout
};
