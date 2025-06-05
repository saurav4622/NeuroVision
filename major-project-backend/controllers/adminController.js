const User = require('../models/User');
const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');

// Initialize system configuration once MongoDB is connected
function initializeSystemConfig() {
  mongoose.connection.once('open', async () => {
    try {
      const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
      if (!config) {
        await new SystemConfig({
          key: 'classificationEnabled',
          value: true,
          description: 'Controls whether the classification system is enabled'
        }).save();
        console.log('Classification system config initialized');
      }
    } catch (error) {
      console.error('Error initializing system config:', error);
    }
  });
}
initializeSystemConfig();

// Get all doctors (optionally sorted)
exports.getDoctors = async (req, res) => {
    try {
        const sort = req.query.sort || 'createdAt';
        const doctors = await User.find({ role: 'doctor' })
            .select('-password')
            .sort({ [sort]: 1 });
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};

// Get all patients (optionally sorted)
exports.getPatients = async (req, res) => {
    try {
        const sort = req.query.sort || 'createdAt';
        const patients = await User.find({ role: 'patient' })
            .select('-password')
            .sort({ [sort]: 1 })
            .lean();
        // For each patient, get latest report and attach classificationType
        const patientIds = patients.map(p => p._id);
        const latestReports = await Report.aggregate([
            { $match: { patient: { $in: patientIds } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$patient', classification: { $first: '$classification' } } }
        ]);
        const reportMap = {};
        latestReports.forEach(r => { reportMap[r._id.toString()] = r.classification; });
        const patientsWithClassification = patients.map(p => ({
            ...p,
            patientInfo: {
                ...p.patientInfo,
                classificationType: reportMap[p._id.toString()] || 'N/A'
            }
        }));
        res.json(patientsWithClassification);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userType, id } = req.params;
        console.log(`Attempting to delete user: type=${userType}, id=${id}`);
        
        const deletedUser = await User.findByIdAndDelete(id);
        console.log('Delete result:', deletedUser ? 'User found and deleted' : 'No user found');
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            message: 'User deleted successfully',
            deletedUser: {
                id: deletedUser._id,
                name: deletedUser.name,
                email: deletedUser.email,
                role: deletedUser.role
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Toggle classification
exports.toggleClassification = async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
        if (!config) {
            return res.status(500).json({ error: 'System configuration not found' });
        }

        config.value = !config.value;
        await config.save();

        res.json({ classificationEnabled: config.value });
    } catch (error) {
        console.error('Error toggling classification:', error);
        res.status(500).json({ error: 'Failed to toggle classification' });
    }
};

// Assign doctor to patient and create appointment
exports.assignDoctorToPatient = async (req, res) => {
    try {
        const { doctorId, patientId, appointmentDate } = req.body;
        if (!doctorId || !patientId || !appointmentDate) {
            return res.status(400).json({ error: 'Doctor ID, Patient ID, and appointment date are required' });
        }
        // Verify doctor exists and is a doctor
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        // Verify patient exists and is a patient
        const patient = await User.findOne({ _id: patientId, role: 'patient' });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        // Update patient with assigned doctor
        patient.assignedDoctor = doctorId;
        await patient.save();
        // Add patient to doctor's assigned patients
        if (!doctor.assignedPatients) {
            doctor.assignedPatients = [];
        }
        if (!doctor.assignedPatients.includes(patientId)) {
            doctor.assignedPatients.push(patientId);
            await doctor.save();
        }
        // Create appointment
        const appointment = new Appointment({
            doctor: doctorId,
            patient: patientId,
            date: new Date(appointmentDate),
            status: 'scheduled'
        });
        await appointment.save();
        // Send email notification to patient and doctor
        const emailService = require('../utils/emailService');
        try {
            await emailService.sendDoctorAssignmentEmail(
                patient.email,
                patient.name,
                doctor.name
            );
        } catch (emailError) {
            console.error('Failed to send doctor assignment email:', emailError);
        }
        res.json({
            success: true,
            message: 'Doctor assigned and appointment scheduled successfully',
            appointment: {
                id: appointment._id,
                doctor: doctorId,
                patient: patientId,
                date: appointment.date,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('Error assigning doctor to patient:', error);
        res.status(500).json({ error: 'Failed to assign doctor to patient' });
    }
};

// Get classification state
exports.getClassificationState = async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
        if (!config) {
            return res.status(500).json({ error: 'System configuration not found' });
        }

        res.json({ classificationEnabled: config.value });
    } catch (error) {
        console.error('Error getting classification state:', error);
        res.status(500).json({ error: 'Failed to get classification state' });
    }
};

// Get all admins
exports.getAdmins = async (req, res) => {
    try {
        const sort = req.query.sort || 'createdAt';
        const admins = await User.find({ role: 'admin' })
            .select('-password')
            .sort({ [sort]: 1 });
        res.json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
};
