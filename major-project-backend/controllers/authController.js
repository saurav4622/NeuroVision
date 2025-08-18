const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Session = require('../models/Session');
const { config } = require('../config');

function generatePatientSerial() {
    // Example: PAT-YYYYMMDD-<random4>
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PAT-${date}-${rand}`;
}

const emailService = require('../utils/emailService');

// Utility: mask email for responses
function maskEmail(email) {
    if (!email) return '';
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name[0] + '***' + name.slice(-1);
    const [d1, d2] = (domain || '').split('.');
    const maskedDomain = d1 ? d1[0] + '***' + (d1.slice(-1) || '') : '';
    return `${maskedName}@${maskedDomain}.${d2 || ''}`;
}

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role = 'patient', patientInfo } = req.body;

        // Avoid logging sensitive details in production
        if (process.env.NODE_ENV !== 'production') {
            console.log('Signup attempt:', { email, role, name });
        }

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                error: "Please provide all required fields" 
            });
        }

        let patientInfoToSave = patientInfo;
        if (role === 'patient') {
            if (!patientInfo || !patientInfo.dateOfBirth) {
                return res.status(400).json({ error: 'Date of birth is required for patients.' });
            }
            // Always generate and assign a unique serial
            patientInfoToSave = { ...patientInfo, serial: generatePatientSerial() };
        }

    // Check if user already exists with this email (in active DB)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
            return res.status(409).json({ 
                success: false,
                error: "Email already registered",
                message: "An account with this email already exists. Please login instead or use a different email.",
                errorType: "DUPLICATE_EMAIL"
            });
        }
    // Check if a pending signup already exists; if yes, replace with new OTP and details
    let pending = await PendingUser.findOne({ email: email.toLowerCase() });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP for email verification
        const otp = emailService.generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15); // OTP valid for 15 minutes

        // Create user object with basic info
        const userData = {
            name,
            email: email.toLowerCase(), // Normalize email to lowercase
            password: hashedPassword,
            role,
            emailVerificationOTP: otp,
            otpExpiry,
            isEmailVerified: false
        };

        // Add role-specific information
        if (role === 'doctor') {
            // Add Dr. prefix if not already present
            if (!name.trim().startsWith('Dr.') && !name.trim().startsWith('DR.') && !name.trim().startsWith('dr.')) {
                userData.name = `Dr. ${name.trim()}`;
            }
            userData.doctorInfo = {
                isVerified: true // Doctors are auto-verified now - simplified registration
            };
        } else if (role === 'patient') {
            userData.patientInfo = patientInfoToSave;
        }

        // Store as pending until OTP verified
        if (pending) {
            await PendingUser.deleteOne({ _id: pending._id });
        }
        const pendingUser = await PendingUser.create(userData);

        // Send verification email - THIS IS REQUIRED, fail if email service is not working
        try {
            await emailService.sendOTPEmail(email, name, otp);
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            // Delete the pending user since email couldn't be sent
            await PendingUser.deleteOne({ _id: pendingUser._id });
            
            // Return error - signup fails if email service is not configured
            return res.status(500).json({
                success: false,
                error: "Email service is not configured properly. User registration requires email verification. Please contact the administrator to configure email settings.",
                details: emailError.message
            });
        }

        // Return minimal info; do NOT expose OTP or sensitive fields
        res.status(201).json({
            success: true,
            message: "User created successfully. Please verify your email to continue.",
            userId: pendingUser._id, // for OTP verification
            emailMasked: maskEmail(email)
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        
        // Handle MongoDB duplicate key error (email already exists)
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(409).json({ 
                success: false,
                error: "Email already exists",
                message: "An account with this email already exists. Please login instead.",
                errorType: "DUPLICATE_EMAIL"
            });
        }
        
        // Handle other validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false,
                error: "Validation failed",
                message: err.message,
                errorType: "VALIDATION_ERROR"
            });
        }
        
        // Handle other errors
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            message: "Something went wrong. Please try again later.",
            errorType: "SERVER_ERROR"
        });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        
        // First try pending users (most likely)
        let pending = await PendingUser.findById(userId);
        if (!pending) {
            // Backward-compatibility: if user was already created in old flow
            const alreadyUser = await User.findById(userId);
            if (!alreadyUser) {
                return res.status(400).json({ error: 'User not found' });
            }
            // Continue verifying old flow users
            var user = alreadyUser; // eslint-disable-line no-var
        }
        
        // Check OTP validity
    const target = pending || user;
    if (target.emailVerificationOTP !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        
        // Check if OTP is expired
        if (new Date() > new Date(target.otpExpiry)) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }
        
        let finalUser = null;
        if (pending) {
            // Promote pending to real User
            const doc = pending.toObject();
            delete doc._id;
            delete doc.createdAt;
            // Create user with verified email
            finalUser = new User({
                ...doc,
                isEmailVerified: true,
                emailVerificationOTP: null,
                otpExpiry: null
            });
            await finalUser.save();
            await PendingUser.deleteOne({ _id: pending._id });
        } else {
            // Old flow - just mark verified
            user.isEmailVerified = true;
            user.emailVerificationOTP = null;
            user.otpExpiry = null;
            await user.save();
            finalUser = user;
        }
        
        // Create token
        const token = jwt.sign(
            { userId: finalUser._id, role: finalUser.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Create session
        const session = new Session({
            userId: finalUser._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();
        
        // Don't send password in response
    const userResponse = finalUser.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationOTP;
        delete userResponse.otpExpiry;
        
        // Update last active time
    finalUser.lastActive = new Date();
    await finalUser.save();
        
        res.status(200).json({
            message: "Email verified successfully",
            token,
            user: userResponse,
            sessionId: session._id
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (typeof userId !== "string") {
            return res.status(400).json({ error: 'Invalid userId' });
        }
        
        let target = await PendingUser.findById(userId);
        let alreadyUser = null;
        if (!target) {
            alreadyUser = await User.findById(userId);
            if (!alreadyUser) return res.status(400).json({ error: 'User not found' });
            if (alreadyUser.isEmailVerified) return res.status(400).json({ error: 'Email already verified' });
            target = alreadyUser;
        }
        
        // Generate new OTP
        const otp = emailService.generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
        
    target.emailVerificationOTP = otp;
    target.otpExpiry = otpExpiry;
    await target.save();
        
        // Send verification email
    await emailService.sendOTPEmail(target.email, target.name, otp);
        
        res.status(200).json({ message: 'OTP has been resent to your email' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (process.env.NODE_ENV !== 'production') {
            console.log('Login attempt:', { email, role });
        }
        
        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = email.toLowerCase();
        
        // Find user by email and include debugging
        if (process.env.NODE_ENV !== 'production') {
            console.log('Searching for user with email:', normalizedEmail);
        }
        const pendingUser = await PendingUser.findOne({ email: normalizedEmail }).exec();
        if (pendingUser) {
            // User started signup but hasn't verified yet
            return res.status(401).json({
                error: "Email not verified",
                requiresVerification: true,
                email: pendingUser.email,
                userId: pendingUser._id
            });
        }

        const foundUser = await User.findOne({ email: normalizedEmail }).exec();
        if (process.env.NODE_ENV !== 'production') {
            console.log('Found user:', foundUser ? 'Yes' : 'No');
        }
        
        // User not found
        if (!foundUser) {
            console.log('User not found in database');
            return res.status(401).json({ 
                success: false,
                error: "Invalid email or password"
            });
        }

        // Verify role matches (case-insensitive)
        if (role && foundUser.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(403).json({ 
                error: role === 'admin'
                    ? "Access Denied - Administrative privileges required"
                    : `Invalid credentials for ${role} access`
            });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, foundUser.password);
        if (!validPassword) {
            return res.status(401).json({ 
                error: "Invalid email or password"
            });
        }
        
        // Check if email is verified
        if (!foundUser.isEmailVerified) {
            // Generate new OTP
            const otp = emailService.generateOTP();
            const otpExpiry = new Date();
            otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
            
            foundUser.emailVerificationOTP = otp;
            foundUser.otpExpiry = otpExpiry;
            await foundUser.save();
            
            // Send verification email
            await emailService.sendOTPEmail(email, foundUser.name, otp);
            
            return res.status(401).json({
                error: "Email not verified",
                requiresVerification: true,
                email: foundUser.email
            });
        }

        // Update last active
        foundUser.lastActive = new Date();
        await foundUser.save();

        // Create token
        const token = jwt.sign(
            { userId: foundUser._id, role: foundUser.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create or update session in MongoDB
        const session = new Session({
            userId: foundUser._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();

        // Don't send password in response
        const userResponse = foundUser.toObject();
        delete userResponse.password;

        console.log('Login successful:', { userId: foundUser._id, role: foundUser.role });
        
        res.json({
            message: "Login successful",
            token,
            user: userResponse,
            sessionId: session._id
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }

        // Invalidate session in MongoDB
        await Session.findOneAndUpdate(
            { token },
            { isValid: false }
        );

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.validateSession = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token and find valid session
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const session = await Session.findOne({ 
            token,
            isValid: true
        });

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        // Get user data
        const user = await User.findById(decoded.userId)
            .select('-password'); // Exclude password

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Update session last active time
        session.lastActive = new Date();
        await session.save();

        // Send back user data
        res.json({ 
            valid: true,
            user,
            sessionId: session._id
        });
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
