// --- Authentication Controller (Register, Login) ---
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

// --- NEW FUNCTION: Domain Validation ---
const validateEmailDomain = (email) => {
    // List of allowed domains
    const allowedDomains = ['gmail.com', 'sru.edu.in'];
    
    // Create a regular expression to match the end of the email string
    const regex = new RegExp(`@(${allowedDomains.join('|')})$`, 'i'); 
    
    return regex.test(email);
};


// @desc    Register a new user (Student or Faculty)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { 
        name, email, password, role, 
        // Student-specific fields
        studentDepartment, batchNo, 
        // Faculty-specific fields
        department, title, bio, availableSlots 
    } = req.body;

    let user = null; // Initialize user to null for safe rollback check in the catch block

    try {
        // --- 1. ENFORCE DOMAIN CHECK ---
        if (!validateEmailDomain(email)) {
            return res.status(400).json({ message: 'Invalid email domain. Please use a college or official email address.' });
        }
        // --- END DOMAIN CHECK ---

        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Prepare data for User creation
        const userData = { name, email, password, role: role || 'student' };
        
        // Add student profile data if registering a student
        if (userData.role === 'student') {
            userData.studentDepartment = studentDepartment;
            userData.batchNo = batchNo;
        }

        // 2. Create the initial User record (facultyId is null/undefined initially)
        user = await User.create(userData);
        
        // 3. If Faculty, create the Faculty profile and link it
        if (user.role === 'faculty') {
            
            // Fix: Ensure availableSlots is passed as a string to Mongoose. 
            let slotsString;
            if (Array.isArray(availableSlots)) {
                slotsString = availableSlots.join(', '); // Convert array to string if necessary
            } else {
                slotsString = availableSlots || 'Not specified'; // Use provided string or default
            }

            const faculty = await Faculty.create({
                userId: user._id, 
                department: department || 'General',
                title: title || 'Lecturer',
                bio: bio || 'No biography provided.',
                availableSlots: slotsString
            });

            // 4. Update the User record with the required facultyId reference
            user.facultyId = faculty._id;
            await user.save(); // This second save now validates 'facultyId' successfully
        }

        // Respond with success message and token
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            facultyId: user.facultyId, 
            token: generateToken(user._id, user.role),
            message: 'Registration successful.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Rollback attempt: Check if user was created but the faculty profile failed
        if (user && user._id && user.role === 'faculty' && !user.facultyId) {
             console.log(`Attempting to delete failed user registration: ${user._id}`);
             // Delete the user if the faculty profile creation failed
             await User.deleteOne({ _id: user._id });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // --- DOMAIN CHECK (Optional on login, but good for consistency) ---
        if (!validateEmailDomain(email)) {
            // We use 401 for login errors so we don't leak information about existing users
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // --- END DOMAIN CHECK ---
        
        const user = await User.findOne({ email }).populate('facultyId');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facultyId: user.facultyId?._id, // Send faculty ID if available
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { registerUser, loginUser };