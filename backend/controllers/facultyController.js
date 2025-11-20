// --- Faculty Data Controller (List, Profile) ---
const Faculty = require('../models/Faculty');
const User = require('../models/User');

// @desc    Get all faculty members with basic info
// @route   GET /api/faculty
// @access  Public
const getAllFaculty = async (req, res) => {
    try {
        // Find all Faculty records and populate the userId to get name and email
        const facultyList = await Faculty.find({})
            .populate('userId', 'name email'); // Select 'name' and 'email' from the User model

        // Map the results to a cleaner format
        const responseData = facultyList.map(faculty => ({
            id: faculty._id,
            name: faculty.userId.name,
            email: faculty.userId.email,
            department: faculty.department,
            title: faculty.title,
            bio: faculty.bio
        }));

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching faculty list:', error);
        res.status(500).json({ message: 'Server error fetching faculty list' });
    }
};

// @desc    Get a single faculty member's profile and available slots
// @route   GET /api/faculty/:facultyId
// @access  Public
const getFacultyProfile = async (req, res) => {
    const { facultyId } = req.params;

    try {
        // Find the specific Faculty record
        const faculty = await Faculty.findById(facultyId)
            .populate('userId', 'name email'); // Populate user details

        if (!faculty) {
            return res.status(404).json({ message: 'Faculty member not found' });
        }

        // Structure the profile response
        const profile = {
            id: faculty._id,
            name: faculty.userId.name,
            email: faculty.userId.email,
            department: faculty.department,
            title: faculty.title,
            bio: faculty.bio,
            availableSlots: faculty.availableSlots,
        };

        res.json(profile);
    } catch (error) {
        console.error('Error fetching faculty profile:', error);
        res.status(500).json({ message: 'Server error fetching faculty profile' });
    }
};

module.exports = { getAllFaculty, getFacultyProfile };