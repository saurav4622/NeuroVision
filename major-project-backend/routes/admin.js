const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  getDoctors,
  getPatients,
  deleteUser,
  toggleClassification,
  getClassificationState,
  assignDoctorToPatient,
  getAdmins,
  changePassword
} = require('../controllers/adminController');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');

// Debug middleware
router.use((req, res, next) => {
    console.log('Admin Route Request:', {
        path: req.path,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body
    });
    next();
});

// Define authentication middleware for all routes
const authenticate = adminAuth;

// Decrypt payload function
const decryptPayload = (encryptedData, key, iv) => {
  const algorithm = 'aes-256-cbc';
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

// Get all doctors
router.get('/doctors', authenticate, getDoctors);

// Get all patients
router.get('/patients', authenticate, getPatients);

// Get all admins
router.get('/admins', authenticate, getAdmins);

// Delete a user (doctor or patient)
router.delete('/:userType/:id', authenticate, deleteUser);

// Toggle classification system
router.post('/toggle-classification', authenticate, toggleClassification);

// Get classification system state
router.get('/classification-state', authenticate, getClassificationState);

// Assign doctor to patient
router.post('/assign-doctor', authenticate, assignDoctorToPatient);

// Change admin password
router.post('/change-password', [
  check('encryptedData').isString(),
  check('key').isString(),
  check('iv').isString()
], authenticate, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { encryptedData, key, iv } = req.body;
    req.body = decryptPayload(encryptedData, key, iv);
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }
}, changePassword);

// Add routes to match frontend URLs
router.get('/dashboard/doctors', authenticate, getDoctors);
router.get('/dashboard/patients', authenticate, getPatients);

module.exports = router;
