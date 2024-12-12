const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const messageSchema = new mongoose.Schema({
    service: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const meetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        unique: true,
    },
    id: {
        type: String,
        unique: true,
        required: true,
        default: randomUUID
    },
    createdBy: {
        type: String,
        unique: true,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    endedAt: {
        type: Date,
    },
    participants: [{
        type: String
    }],
    codeHistory: [{
        code: String,
        language: String,
        timestamp: Date,
        author: String
    }],
    status: {
        type: String,
        enum: ['active', 'ended'],
        default: 'active'
    },
    messages: {
        type: [messageSchema],
        default: [],  // Changed from required: true to default: [] for better usability
    }
});

module.exports = mongoose.model('Meeting', meetingSchema);