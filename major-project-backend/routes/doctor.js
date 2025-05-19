const express = require('express');
const router = express.Router();
const sessionAuth = require('../middleware/sessionAuth');
const {
    getAssignedPatients,
    getPatientsByCategory,
    getPatientReports,
    updatePatientReport,
    getAppointments,
    updateAppointmentStatus,
    getPatientAppointments
} = require('../controllers/doctorController');

// Define authentication middleware for all routes
const authenticate = sessionAuth;

// Get all patients assigned to the doctor
router.get('/patients', authenticate, getAssignedPatients);

// Get patients categorized by classification
router.get('/patients/by-category', authenticate, getPatientsByCategory);

// Get all reports for a specific patient
router.get('/patients/:patientId/reports', authenticate, getPatientReports);

// Update a report
router.put('/reports/:reportId', authenticate, updatePatientReport);

// Get all appointments for the logged-in doctor (optionally filter by date)
router.get('/appointments', authenticate, getAppointments);

// Get all appointments for the logged-in patient
router.get('/appointments/patient', authenticate, getPatientAppointments);

// Update appointment status (approve/deny/complete)
router.put('/appointments/:appointmentId/status', authenticate, updateAppointmentStatus);

module.exports = router;
