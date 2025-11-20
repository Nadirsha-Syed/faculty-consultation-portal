// --- Auth Middleware for JWT Verification ---
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Required to fetch user details

// Middleware function to protect routes (verify JWT)
const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (format is 'Bearer <token>')
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token and decode payload
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Attach user data (without password) to the request object
            // This user object is what controllers rely on (req.user.id, req.user.role)
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Simplified object containing only necessary fields
            req.user = { id: user._id, role: user.role };
            
            next();

        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };