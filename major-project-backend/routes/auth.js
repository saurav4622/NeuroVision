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

router.post('/signup', signupLimiter, signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate-session', validateSession);
router.post('/verify-email', verifyEmailLimiter, verifyEmail);
router.post('/resend-otp', resendOTP);

module.exports = router;
