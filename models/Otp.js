const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Optional: Auto-delete after 24 hours to keep DB clean
    }
});

module.exports = mongoose.model('Otp', otpSchema);