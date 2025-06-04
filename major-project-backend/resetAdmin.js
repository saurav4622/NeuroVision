// Script to reset an admin user's password in the database
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { config } = require('./config');

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

  // Delete all admin users
  await User.deleteMany({ role: 'admin' });
  console.log('All admin users deleted.');

  // Prompt to create a new admin
  const name = await prompt('New Admin Name: ');
  const email = await prompt('New Admin Email: ');
  const password = await prompt('New Admin Password: ');
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    isEmailVerified: true
  });
  await admin.save();
  console.log('New admin created and verified!');
  rl.close();
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  rl.close();
  mongoose.disconnect();
});
