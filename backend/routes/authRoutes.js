// --- Auth Routes ---
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();

// Register a new user (student or faculty)
router.post('/register', registerUser);

// Authenticate and login a user
router.post('/login', loginUser);

module.exports = router;