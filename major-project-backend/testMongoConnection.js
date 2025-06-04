const mongoose = require('mongoose');
const { config } = require('./config');

async function testConnection() {
  try {
    await mongoose.connect(config.MONGODB_URI, config.DB_OPTIONS);
    console.log('Successfully connected to MongoDB');
    mongoose.disconnect();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

testConnection();
