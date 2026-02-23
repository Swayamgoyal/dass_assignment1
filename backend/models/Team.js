const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    teamLeaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    teamSize: {
        type: Number,
        required: true,
        min: 2,
        max: 10
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true
    },
    members: [{
        participantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participant'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    registrationStatus: {
        type: String,
        enum: ['incomplete', 'complete'],
        default: 'incomplete'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique invite code
teamSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Team', teamSchema);
