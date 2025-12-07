const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { loginLimiter } = require('../middleware/rateLimit');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const { 
    signup, 
    login, 
    logout, 
    validateSession, 
    verifyEmail, 
    resendOTP 
} = require('../controllers/authController');

// Helper for AES-256-CBC encrypted payloads from the frontend
const decryptPayload = (encryptedData, key, iv) => {
    if (!encryptedData || !key || !iv) return null;
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex')
    );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};

const decryptMiddleware = (req, res, next) => {
    const { encryptedData, key, iv } = req.body || {};
    if (encryptedData && key && iv) {
        try {
            req.body = decryptPayload(encryptedData, key, iv);
        } catch (err) {
            console.error('Failed to decrypt auth payload:', err.message);
            return res.status(400).json({ error: 'Invalid encrypted payload' });
        }
    }
    next();
};

// Rate limiter for signup route: max 5 requests per hour per IP
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many signup attempts from this IP, please try again after an hour'
});

// Rate limiter for verify-email route: max 5 requests per hour per IP
const verifyEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many verification attempts from this IP, please try again after an hour'
});

router.post('/signup', signupLimiter, decryptMiddleware, signup);
router.post('/login', decryptMiddleware, login);
router.post('/logout', logout);
router.get('/validate-session', validateSession);
router.post('/verify-email', verifyEmailLimiter, verifyEmail);
router.post('/resend-otp', resendOTP);

module.exports = router;
