const rateLimit = require('express-rate-limit');

const resetAttemptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many verification attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// New: Login rate limiter to mitigate brute-force attempts
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // allow up to 10 login attempts per 10 minutes per IP
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    resetAttemptLimiter,
    loginLimiter
};
