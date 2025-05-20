require('dotenv').config();
const mongoose = require('mongoose');

const config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Alzheimers_Database',
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET || 'alzheimers-detection-system-secret-2025',
    DB_OPTIONS: {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4 
    }
};

module.exports = config;
