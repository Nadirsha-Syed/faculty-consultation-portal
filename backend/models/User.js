// --- User Model for Authentication ---
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    role: {
        type: String,
        enum: ['student', 'faculty'],
        default: 'student',
    },
    // NEW: Student profile details
    studentDepartment: {
        type: String,
        required: function() { return this.role === 'student'; }
    },
    batchNo: {
        type: String,
        required: function() { return this.role === 'student'; }
    },
    // Reference to Faculty specific details if the user is a faculty member
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        // CRITICAL FIX: Only require facultyId if the role is 'faculty' AND the document is NOT new (i.e., after the first save).
        required: function() { return this.role === 'faculty' && this.isNew === false; }
    }
}, { timestamps: true });

// Pre-save hook to hash the password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);