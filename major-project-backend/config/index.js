require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB Atlas if MONGO_URI is provided
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('✅ MongoDB Atlas connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
}

const config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Alzheimers_Database',
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET || 'alzheimers-detection-system-secret-2025',
    DB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true
    }
};

// MongoDB Connection Events
mongoose.connection.on('connected', () => {
    console.log('MongoDB Connection Established');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Connection Disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB Connection Closed');
    process.exit(0);
});

module.exports = config;
