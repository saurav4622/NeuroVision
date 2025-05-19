const path = require('path');
const mongoose = require('mongoose');
const config = require('./config');
require('dotenv').config();

// MongoDB Connection Options
mongoose.set('strictQuery', false);

// Import app.js which contains all route configurations
const app = require('./app');

// No need to configure routes here - they are already configured in app.js

// Connect to MongoDB with proper configurations
mongoose.connect(config.MONGODB_URI, config.DB_OPTIONS)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Connection Details:');
    console.log('- Database:', mongoose.connection.name);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// App is already imported at the top of the file

// Add health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const startServer = async (port) => {
    try {
        const server = await new Promise((resolve, reject) => {
            const server = app.listen(port)
                .once('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`Port ${port} is busy, trying ${port + 1}...`);
                        server.close();
                        resolve(startServer(port + 1));
                    } else {
                        reject(err);
                    }
                })
                .once('listening', () => {
                    console.log(`Server running on http://localhost:${port}`);
                    console.log('Available routes:');
                    console.log('- /health (GET)');
                    console.log('- /api/auth/signup (POST)');
                    console.log('- /api/auth/login (POST)');
                    resolve(server);
                });
        });
        return server;
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;
startServer(PORT).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
