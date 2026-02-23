const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // Basic Information
    eventName: {
        type: String,
        required: true,
        trim: true
    },
    eventDescription: {
        type: String,
        required: true
    },
    eventType: {
        type: String,
        enum: ['Normal', 'Merchandise'],
        required: true
    },

    // Eligibility & Dates
    eligibility: {
        type: String,
        required: true
    },
    registrationDeadline: {
        type: Date,
        required: true
    },
    eventStartDate: {
        type: Date,
        required: true
    },
    eventEndDate: {
        type: Date,
        required: true
    },

    // Registration Settings
    registrationLimit: {
        type: Number,
        default: null // null means unlimited
    },
    registrationFee: {
        type: Number,
        default: 0
    },
    eventTags: [{
        type: String,
        trim: true
    }],

    // Team Event Settings (Phase 8)
    isTeamEvent: {
        type: Boolean,
        default: false
    },
    maxTeamSize: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },

    // Organizer Reference
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },

    // Event Status
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
        default: 'Draft'
    },

    // For Normal Events - Custom Registration Form
    customForm: [{
        fieldId: {
            type: String,
            required: true
        },
        fieldType: {
            type: String,
            enum: ['text', 'email', 'number', 'textarea', 'dropdown', 'radio', 'checkbox', 'file'],
            required: true
        },
        fieldLabel: {
            type: String,
            required: true
        },
        fieldPlaceholder: {
            type: String,
            default: ''
        },
        isRequired: {
            type: Boolean,
            default: false
        },
        options: [{
            type: String
        }], // For dropdown, radio, checkbox
        order: {
            type: Number,
            required: true
        },
        validation: {
            minLength: Number,
            maxLength: Number,
            pattern: String
        }
    }],

    // For Merchandise Events
    merchandiseDetails: {
        itemName: String,
        variants: [{
            variantId: {
                type: String,
                required: true
            },
            size: String,
            color: String,
            stock: {
                type: Number,
                required: true,
                min: 0
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }],
        purchaseLimitPerParticipant: {
            type: Number,
            default: 1
        },
        // Allow participants to register without buying merchandise
        allowRegistrationOnly: {
            type: Boolean,
            default: false
        },
        // Fee for registration-only (0 = free, >0 = paid)
        registrationOnlyFee: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // Analytics
    currentRegistrations: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    // Phase 7: Admin moderation fields
    flagged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String
    },
    flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    flaggedAt: {
        type: Date
    },

    // Form Lock Status
    formLocked: {
        type: Boolean,
        default: false
    },

    // Timestamps
    publishedAt: Date
}, {
    timestamps: true
});

// Indexes for performance
eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ status: 1, eventStartDate: 1 });
eventSchema.index({ eventTags: 1 });
eventSchema.index({ 'merchandiseDetails.variants.variantId': 1 });

// Virtual for checking if registrations are open
eventSchema.virtual('isRegistrationOpen').get(function () {
    const now = new Date();
    return this.status === 'Published' &&
        now <= this.registrationDeadline &&
        (this.registrationLimit === null || this.currentRegistrations < this.registrationLimit);
});

// Method to check if event can be edited
eventSchema.methods.canEdit = function (field) {
    if (this.status === 'Draft') {
        return true;
    }

    if (this.status === 'Published') {
        const allowedFields = ['eventDescription', 'eventTags', 'registrationDeadline', 'registrationLimit'];
        return allowedFields.includes(field);
    }

    return false;
};

// Method to lock form after first registration
eventSchema.methods.lockForm = async function () {
    if (!this.formLocked && this.eventType === 'Normal') {
        this.formLocked = true;
        await this.save();
    }
};

module.exports = mongoose.model('Event', eventSchema);
