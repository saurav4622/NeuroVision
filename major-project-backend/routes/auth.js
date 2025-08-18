const express = require('express');
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

// Optional decrypt support if frontend sends { encryptedData, key, iv }
const decryptPayload = (encryptedData, key, iv) => {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};

router.post(
    '/signup',
    [
        // allow either plaintext fields or encrypted payload
        check('name').optional().isString().trim().escape(),
        check('email').optional().isString().trim().escape(),
        check('password').optional().isString().trim(),
        check('role').optional().isString().trim().escape(),
        check('patientInfo').optional().isObject(),
        check('encryptedData').optional().isString(),
        check('key').optional().isString(),
        check('iv').optional().isString(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { encryptedData, key, iv } = req.body || {};
            if (encryptedData && key && iv) {
                req.body = decryptPayload(encryptedData, key, iv);
            }
            next();
        } catch (e) {
            return res.status(400).json({ error: 'Invalid encrypted payload' });
        }
    },
    signup
);
router.post(
    '/login',
    loginLimiter,
    [
        // either a normal body with email/password/role, or encryptedData+key+iv strings
        check('email').optional().isString().trim().escape(),
        check('password').optional().isString().trim(),
        check('role').optional().isString().trim().escape(),
        check('encryptedData').optional().isString(),
        check('key').optional().isString(),
        check('iv').optional().isString(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { encryptedData, key, iv } = req.body || {};
            if (encryptedData && key && iv) {
                req.body = decryptPayload(encryptedData, key, iv);
            }
            next();
        } catch (e) {
            return res.status(400).json({ error: 'Invalid encrypted payload' });
        }
    },
    login
);
router.post('/logout', logout);
router.get('/validate-session', validateSession);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);

module.exports = router;
