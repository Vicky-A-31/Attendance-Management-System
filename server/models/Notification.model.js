const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['sms', 'whatsapp', 'email'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'test'],
        default: 'test'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
