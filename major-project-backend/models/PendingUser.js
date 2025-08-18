const mongoose = require('mongoose');

// Temporary user storage until email is verified
const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'patient'],
    default: 'patient',
    required: true
  },
  // Keep same shape for easy promotion to real User
  doctorInfo: {
    isVerified: { type: Boolean, default: true }
  },
  patientInfo: {
    dateOfBirth: { type: Date },
    gender: { type: String },
    medicalHistory: [String],
    serial: { type: String }
  },
  emailVerificationOTP: { type: String, required: true },
  otpExpiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 15 }, // auto-clean after ~15 minutes
});

// Index for faster lookups
pendingUserSchema.index({ email: 1 });

// Strip sensitive fields from any serialization to avoid accidents
pendingUserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationOTP;
    delete ret.otpExpiry;
    return ret;
  }
});
pendingUserSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationOTP;
    delete ret.otpExpiry;
    return ret;
  }
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);
