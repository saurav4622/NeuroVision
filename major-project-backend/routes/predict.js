const express = require('express');
const router = express.Router();
const { 
    predict, 
    getPatientReports, 
    getReport, 
    updateReport 
} = require('../controllers/predictController');
const sessionAuth = require('../middleware/sessionAuth');

// Public routes - made these accessible without authentication for testing
router.post('/', predict);

// Add a test endpoint to verify the predict route is registered
router.get('/', (req, res) => {
  res.json({ message: 'Prediction API is working' });
});

// Define the protected routes with authentication middleware applied individually
const authenticate = sessionAuth;

// Get all reports for a patient
router.get('/reports/patient/:patientId', authenticate, getPatientReports);

// Get specific report
router.get('/reports/:reportId', authenticate, getReport);

// Update a report
router.put('/reports/:reportId', authenticate, updateReport);

module.exports = router;
