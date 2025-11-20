// --- Faculty Routes ---
const express = require('express');
const { getAllFaculty, getFacultyProfile } = require('../controllers/facultyController');
const router = express.Router();

// Get list of all faculty members
router.get('/', getAllFaculty);

// Get a specific faculty member's profile and slots
router.get('/:facultyId', getFacultyProfile);

module.exports = router;