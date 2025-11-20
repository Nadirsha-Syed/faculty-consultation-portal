// --- Profile Routes ---
const express = require('express');
const { updateFacultyProfile, updateStudentProfile } = require('../controllers/profileController'); // Import new functions
const { protect } = require('../middleware/authMiddleware'); // Authentication middleware
const router = express.Router();

// PUT /api/profile/faculty: Update Faculty Profile (Bio, Dept, Slots)
// Access: Private (Faculty only)
router.put('/faculty', protect, updateFacultyProfile);

// PUT /api/profile/student: Update Student Profile (Name, Dept, Batch No)
// Access: Private (Student only)
router.put('/student', protect, updateStudentProfile);

module.exports = router;