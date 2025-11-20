// --- Faculty Profile and Schedule Model ---
const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
    // User ID reference from the User collection for authentication
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    department: {
        type: String,
        required: false, 
    },
    title: {
        type: String,
        default: 'Professor'
    },
    bio: {
        type: String,
        maxlength: 500,
        default: 'Dedicated academic professional.'
    },
    // CHANGED: Simplified availableSlots from Array to String for easy text entry
    availableSlots: {
        type: String,
        default: 'Not specified'
    }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', FacultySchema);