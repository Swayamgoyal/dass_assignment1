const mongoose = require('mongoose');

const teamMessageSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    messageType: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient message retrieval
teamMessageSchema.index({ teamId: 1, timestamp: 1 });
teamMessageSchema.index({ teamId: 1, timestamp: -1 });

module.exports = mongoose.model('TeamMessage', teamMessageSchema);
