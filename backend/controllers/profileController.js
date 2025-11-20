// --- Profile Update Controller (Handles both Faculty and Student updates) ---
const Faculty = require('../models/Faculty');
const User = require('../models/User');

// @desc    Update authenticated faculty user's profile data
// @route   PUT /api/profile/faculty
// @access  Private (Faculty only)
const updateFacultyProfile = async (req, res) => {
    const facultyUserId = req.user.id; // User ID from the JWT token
    const { department, title, bio, availableSlots } = req.body;

    try {
        // Find the corresponding Faculty profile using the User ID
        const faculty = await Faculty.findOne({ userId: facultyUserId });

        if (!faculty) {
            return res.status(404).json({ message: 'Faculty profile not found.' });
        }

        // Update fields if provided
        if (department !== undefined) faculty.department = department;
        if (title !== undefined) faculty.title = title;
        if (bio !== undefined) faculty.bio = bio;
        if (availableSlots !== undefined) faculty.availableSlots = availableSlots;

        await faculty.save();

        res.json({ 
            message: 'Profile updated successfully.', 
            faculty 
        });

    } catch (error) {
        console.error('Error updating faculty profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Update authenticated student user's profile data
// @route   PUT /api/profile/student
// @access  Private (Student only)
const updateStudentProfile = async (req, res) => {
    const studentId = req.user.id; // User ID from the JWT token
    const { studentDepartment, batchNo, name } = req.body;

    try {
        const user = await User.findById(studentId);

        if (!user || user.role !== 'student') {
            return res.status(403).json({ message: 'Not authorized or user is not a student.' });
        }

        // Update name, department, and batch if provided
        if (name) user.name = name;
        if (studentDepartment) user.studentDepartment = studentDepartment;
        if (batchNo) user.batchNo = batchNo;

        await user.save();

        // After saving, update the auth token and client session data
        const token = require('jsonwebtoken').sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            message: 'Profile updated successfully.', 
            name: user.name,
            role: user.role,
            token: token,
            // Include updated student fields in response to refresh frontend state
            studentDepartment: user.studentDepartment,
            batchNo: user.batchNo
        });

    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({ message: 'Server error updating student profile' });
    }
};

module.exports = { updateFacultyProfile, updateStudentProfile };