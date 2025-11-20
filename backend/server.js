// --- Server Setup and Initialization ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Check for critical email environment variables and warn if missing
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ WARNING: Email notifications disabled. Set EMAIL_USER and EMAIL_PASS in .env to enable.");
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const profileRoutes = require('./routes/profileRoutes'); // NEW: For Faculty Profile Editing

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
// CRITICAL FIX: Explicitly configure CORS to allow connections from all origins (*).
app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
})); 
app.use(express.json()); // Body parser for JSON data

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

connectDB();

// Define API routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', profileRoutes); // NEW: Route for profile management

// Simple root route
app.get('/', (req, res) => {
    res.send('Faculty Consultation Portal API Running...');
});

// Start the server
// Listening on '0.0.0.0' helps bypass local firewall issues
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the API via http://localhost:${PORT}`);
});