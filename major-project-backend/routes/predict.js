const express = require('express');
const router = express.Router();
const { 
    predict
} = require('../controllers/predictController');
const sessionAuth = require('../middleware/sessionAuth');
const upload = require('../middleware/upload');

// Debug log to verify if `predict` is defined
console.log('Predict function:', predict);

// Public routes - made these accessible without authentication for testing
router.post('/', (req, res, next) => {
  console.log('Incoming request to /api/predict');
  next();
}, upload.single('file'), (req, res, next) => {
  console.log('File received:', req.file);
  console.log('Request body:', req.body);
  next();
}, predict);

// Add a test endpoint to verify the predict route is registered
router.get('/', (req, res) => {
  res.json({ message: 'Prediction API is working' });
});

module.exports = router;
