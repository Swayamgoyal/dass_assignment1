const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    action: {
        type: String,
        required: true,
        // Actions: CREATE_ORGANIZER, UPDATE_ORGANIZER, SUSPEND_ORGANIZER, DELETE_ORGANIZER,
        // APPROVE_EVENT, REJECT_EVENT, FLAG_EVENT, DELETE_EVENT, etc.
    },
    targetType: {
        type: String,
        required: true,
        enum: ['Organizer', 'Event', 'Participant', 'System']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        // Can store any additional information about the action
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Index for querying
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
