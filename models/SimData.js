const mongoose = require('mongoose');

const SimDataSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true // Faster search
    },
    full_name: {
        type: String,
        default: 'Unknown'
    },
    cnic: {
        type: String,
        default: 'N/A'
    },
    address: {
        type: String,
        default: 'N/A'
    },
    network: {
        type: String,
        default: 'Unknown'
    },
    date_activated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('SimData', SimDataSchema);
