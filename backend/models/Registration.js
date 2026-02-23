const mongoose = require('mongoose');
const crypto = require('crypto');

const registrationSchema = new mongoose.Schema({
    // References
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },

    // Team reference (Phase 8 - for team events)
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },

    // Registration Type
    registrationType: {
        type: String,
        enum: ['Normal', 'Merchandise', 'MerchRegOnly'],
        required: true
    },

    // For Normal Events - Form Responses
    formResponses: {
        type: Map,
        of: mongoose.Schema.Types.Mixed // Allows any type of value
    },

    // For Team Events (Phase 8)
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },

    // For Merchandise Events
    merchandiseVariant: {
        variantId: String,
        size: String,
        color: String,
        price: {
            type: Number,
            min: 0
        },
        quantity: {
            type: Number,
            min: 1
        }
    },

    // Ticket Information
    ticketId: {
        type: String,
        unique: true,
        required: true
    },
    qrCode: {
        type: String // Will store base64 encoded QR code or URL
    },

    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },
    paymentProof: String, // URL to uploaded payment proof (Tier A Feature 2)

    // Approval Status (Tier A Feature 2)
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved'
    },

    // Attendance
    attendance: {
        marked: {
            type: Boolean,
            default: false
        },
        timestamp: Date
    },

    // Registration Status
    status: {
        type: String,
        enum: ['Active', 'Cancelled', 'Rejected'],
        default: 'Active'
    },

    // Timestamps
    registeredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
// Partial unique index: only enforce uniqueness for Active registrations
registrationSchema.index(
    { eventId: 1, participantId: 1 },
    { unique: true, partialFilterExpression: { status: 'Active' } }
);
registrationSchema.index({ ticketId: 1 });
registrationSchema.index({ participantId: 1, status: 1 });
registrationSchema.index({ eventId: 1, status: 1 });

// Pre-save hook to generate unique ticket ID
registrationSchema.pre('save', function (next) {
    if (!this.ticketId) {
        // Generate ticket ID: FEL-[8 random chars]-[timestamp]
        const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        this.ticketId = `FEL-${randomString}-${timestamp}`;
    }
    next();
});

// Virtual to get ticket URL
registrationSchema.virtual('ticketUrl').get(function () {
    return `/tickets/${this.ticketId}`;
});

// Method to mark attendance
registrationSchema.methods.markAttendance = async function () {
    this.attendance.marked = true;
    this.attendance.timestamp = new Date();
    await this.save();
};

// Method to cancel registration
registrationSchema.methods.cancelRegistration = async function () {
    this.status = 'Cancelled';
    await this.save();
};

module.exports = mongoose.model('Registration', registrationSchema);
