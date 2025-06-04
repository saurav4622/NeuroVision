const jwt = require('jsonwebtoken');
const { config } = require('../config');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    try {
        // Get token from different possible locations
        let token = req.header('Authorization') || req.header('authorization');
        
        // Check query string if no header
        if (!token && req.query.token) {
            token = req.query.token;
        }

        // Format token - remove 'Bearer ' if present
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ 
                error: 'Authentication required',
                details: 'No authentication token found in request'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, config.JWT_SECRET);
            console.log('Token decoded successfully:', { userId: decoded.userId, role: decoded.role });
        } catch (jwtError) {
            console.error('JWT Verification failed:', jwtError.message);
            return res.status(401).json({ 
                error: 'Invalid token',
                details: 'Token verification failed'
            });
        }

        // Find admin user
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('User not found:', decoded.userId);
            return res.status(404).json({ 
                error: 'User not found',
                details: 'The user associated with this token no longer exists'
            });
        }

        if (user.role !== 'admin') {
            console.log('Non-admin access attempt:', { userId: user._id, role: user.role });
            return res.status(403).json({ 
                error: 'Access denied',
                details: 'This endpoint requires admin privileges'
            });
        }

        console.log('Admin access granted:', { userId: user._id, role: user.role });
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ 
            error: 'Server error',
            details: 'An unexpected error occurred while authenticating'
        });
    }
};

module.exports = adminAuth;
