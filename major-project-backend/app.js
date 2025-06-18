const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const predictRoutes = require('./routes/predict');
const passwordResetRoutes = require('./routes/passwordReset');
const doctorRoutes = require('./routes/doctor');

const app = express();

// Basic middleware
// Robust CORS setup to avoid undefined origins
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/doctor', doctorRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
