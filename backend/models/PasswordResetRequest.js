const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminComment: {
        type: String,
        trim: true
    },
    newPassword: {
        type: String // Hashed password, only if approved
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
});

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
