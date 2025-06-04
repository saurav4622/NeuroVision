const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const { config } = require('../config');

const sessionAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify JWT
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Check if session exists and is valid
        const session = await Session.findOne({ 
            token,
            isValid: true
        });

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        // Update session last active time
        session.lastActive = new Date();
        await session.save();

        // Add user info to request
        req.user = decoded;
        req.session = session;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: err.message });
    }
};

module.exports = sessionAuth;
