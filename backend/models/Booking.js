// --- Consultation Booking Model ---
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    // Student who requested the booking (references User model)
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Faculty member for the consultation (references Faculty model)
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true,
    },
    // Original date/time preference submitted by the student (now just a preference)
    dateTime: {
        type: Date,
        required: true,
    },
    // NEW: Optional message from student during request submission
    studentMessage: {
        type: String,
        maxlength: 300,
        default: ''
    },
    // Final approved date/time set by the faculty
    finalDateTime: {
        type: Date,
        required: function() { return this.status === 'approved'; } // Only required if approved
    },
    // Meeting location set by the faculty
    roomNumber: {
        type: String,
        required: function() { return this.status === 'approved'; } // Only required if approved
    },
    durationMinutes: {
        type: Number,
        required: true,
        default: 30, // Default to 30 minutes
    },
    topic: {
        type: String,
        required: [true, 'Consultation topic is required'],
        maxlength: 150,
    },
    status: {
        type: String,
        // ADDED 'cancelled' and 'reschedule' statuses
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'reschedule'],
        default: 'pending',
    },
}, { timestamps: true });

// Indexing for faster queries (e.g., finding bookings for a specific faculty member)
BookingSchema.index({ faculty: 1, dateTime: 1 });

module.exports = mongoose.model('Booking', BookingSchema);