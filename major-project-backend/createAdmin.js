// Script to create an admin user in the database
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { config } = require('./config');
const emailService = require('./utils/emailService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  await mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
  console.log('MONGODB_URI:', config.MONGODB_URI);
  console.log('process.env.MONGODB_URI:', process.env.MONGODB_URI);

  const secret = process.env.ADMIN_CREATION_SECRET;
  if (!secret) {
    console.error('ADMIN_CREATION_SECRET is not set in the environment variables.');
    process.exit(1);
  }

  const providedSecret = await prompt('Enter the admin creation secret: ');
  if (providedSecret !== secret) {
    console.error('Invalid secret. You are not authorized to create an admin.');
    rl.close();
    mongoose.disconnect();
    return;
  }

  const name = await prompt('Admin Name: ');
  const email = await prompt('Admin Email: ');
  
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const existing = await User.findOne({ email, role: 'admin' });
  if (existing) {
    console.log('Admin with this email already exists.');
    rl.close();
    mongoose.disconnect();
    return;
  }

  // Remove any user with this email (admin or not)
  await User.deleteMany({ email });

  // Generate OTP for email verification
  const otp = emailService.generateOTP();
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 15); // OTP valid for 15 minutes

  const admin = new User({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    isEmailVerified: false,
    emailVerificationOTP: otp,
    otpExpiry: otpExpiry
  });
  
  await admin.save();
  
  // Send OTP verification email
  try {
    await emailService.sendOTPEmail(email, name, otp);
    console.log('Admin account created! OTP verification email sent.');
    console.log('Please check your email and verify with the OTP.');
    
    // Now handle OTP verification
    const enteredOTP = await prompt('Enter the OTP sent to your email: ');
    
    if (enteredOTP === otp && new Date() < otpExpiry) {
      // Mark as verified and send credentials
      admin.isEmailVerified = true;
      admin.emailVerificationOTP = null;
      admin.otpExpiry = null;
      await admin.save();
      
      // Send admin credentials email
      await emailService.sendAdminCredentialsEmail(email, name, tempPassword);
      console.log('Email verified successfully!');
      console.log('Admin credentials have been sent to your email.');
      console.log('Please check your email for login details.');
    } else {
      console.log('Invalid or expired OTP. Admin account created but not verified.');
      console.log('You will need to verify your email before you can log in.');
    }
  } catch (error) {
    console.error('Error sending email:', error.message);
    console.log('Admin account created but email verification failed.');
    console.log('Temporary password:', tempPassword);
  }
  rl.close();
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  rl.close();
  mongoose.disconnect();
});
