const { spawn } = require('child_process');
const path = require('path');
const Report = require('../models/Report');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');

exports.predict = async (req, res) => {
    try {
        const { image, patientId, notes } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Check if classification is enabled
        const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
        const classificationEnabled = config ? config.value : true;

        if (!classificationEnabled) {
            return res.status(403).json({ 
                error: 'Classification is currently disabled by admin',
                classificationEnabled: false
            });
        }

        // Verify patient exists if ID is provided
        let patient = null;
        if (patientId) {
            patient = await User.findById(patientId);
            if (!patient || patient.role !== 'patient') {
                return res.status(400).json({ error: 'Invalid patient ID' });
            }
        }

        // Extract the base64 image data if it contains a header
        let imageData = image;
        if (image.includes('base64,')) {
            imageData = image.split('base64,')[1];
        }

        console.log('Preparing to run prediction Python script...');
        
        // Use 'python' on Windows or 'python3' on Unix
        const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
        const pythonScript = path.join(__dirname, '../python/predict.py');
        
        console.log(`Using Python executable: ${pythonExecutable}`);
        console.log(`Python script path: ${pythonScript}`);
        
        const python = spawn(pythonExecutable, [
            pythonScript,
            JSON.stringify({ image: imageData })
        ]);
        
        let outputData = '';
        let errorData = '';

        python.stdout.on('data', (data) => {
            const chunk = data.toString();
            console.log('Python output:', chunk);
            outputData += chunk;
        });
        
        python.stderr.on('data', (data) => {
            const chunk = data.toString();
            console.error('Python error:', chunk);
            errorData += chunk;
        });
        
        python.on('close', async (code) => {
            console.log(`Python process exited with code ${code}`);
            
            if (code !== 0) {
                console.error('Python Error:', errorData);
                return res.status(500).json({ 
                    error: 'Prediction failed',
                    details: errorData
                });
            }

            try {
                console.log('Parsing output data:', outputData);
                const result = JSON.parse(outputData);
                
                if (result.error) {
                    console.error('Error in prediction result:', result.error);
                    if (result.traceback) {
                        console.error('Python traceback:', result.traceback);
                    }
                    return res.status(500).json({ 
                        error: result.error,
                        details: result.traceback || 'No additional details available'
                    });
                }
                
                if (!result.prediction) {
                    return res.status(500).json({ error: 'Failed to parse prediction result' });
                }
                
                // Save classification results to database if patient is provided
                const imagePreview = image.substring(0, 100) + '...'; // Store only a preview
                
                if (patient) {
                    const report = new Report({
                        patient: patient._id,
                        classification: result.prediction,
                        classificationDetails: result.probabilities || {
                            AD: result.prediction === 'AD' ? 1 : 0,
                            CN: result.prediction === 'CN' ? 1 : 0,
                            EMCI: result.prediction === 'EMCI' ? 1 : 0,
                            LMCI: result.prediction === 'LMCI' ? 1 : 0
                        },
                        image: imagePreview,
                        notes: notes || '',
                        status: 'pending'
                    });
                    
                    // If patient has an assigned doctor, add to the report
                    if (patient.assignedDoctor) {
                        report.doctor = patient.assignedDoctor;
                    }
                    
                    await report.save();
                    
                    // Update user's meta information
                    await User.findByIdAndUpdate(patient._id, {
                        $inc: { 'meta.reportCount': 1, 'meta.successfulScans': 1 },
                        lastScanDate: new Date()
                    });
                    
                    result.reportId = report._id;
                    result.reportSaved = true;
                    
                    // Notify assigned doctor if exists
                    if (patient.assignedDoctor) {
                        try {
                            const doctor = await User.findById(patient.assignedDoctor);
                            if (doctor) {
                                const emailService = require('../utils/emailService');
                                await emailService.sendNewReportNotificationEmail(
                                    doctor.email,
                                    doctor.name,
                                    patient.name
                                );
                            }
                        } catch (emailError) {
                            console.error('Failed to notify doctor:', emailError);
                        }
                    }
                }
                
                res.json({
                    ...result,
                    interpretations: getClassificationInterpretation(result.prediction)
                });
                
            } catch (error) {
                console.error('JSON Parse Error:', error);
                res.status(500).json({ 
                    error: 'Failed to parse prediction result',
                    details: outputData
                });
            }
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

// Get interpretation for each classification type
function getClassificationInterpretation(classification) {
    const interpretations = {
        'AD': {
            fullName: 'Alzheimer\'s Disease',
            description: 'The scan indicates signs consistent with Alzheimer\'s Disease. This typically involves significant cognitive decline and memory impairment.',
            recommendations: 'Immediate consultation with a neurologist is recommended. Treatment options may include medication to manage symptoms and lifestyle adjustments.'
        },
        'CN': {
            fullName: 'Cognitively Normal',
            description: 'The scan appears normal with no significant abnormalities detected. Cognitive function appears to be within normal parameters.',
            recommendations: 'Continue regular check-ups and maintain a healthy lifestyle including mental exercises, balanced diet, and physical activity.'
        },
        'EMCI': {
            fullName: 'Early Mild Cognitive Impairment',
            description: 'The scan shows subtle changes that may indicate early mild cognitive impairment. This may involve slight memory problems, but generally doesn\'t interfere with daily activities.',
            recommendations: 'Regular monitoring is advised. Consider cognitive exercises and lifestyle modifications that support brain health.'
        },
        'LMCI': {
            fullName: 'Late Mild Cognitive Impairment',
            description: 'The scan indicates late-stage mild cognitive impairment. This represents a more advanced stage with more noticeable memory and cognitive issues.',
            recommendations: 'Consultation with a neurologist is recommended. Early intervention can help manage symptoms and potentially slow progression.'
        }
    };
    
    return interpretations[classification] || {
        fullName: classification,
        description: 'Classification interpretation not available',
        recommendations: 'Please consult with a healthcare professional for proper diagnosis and recommendations.'
    };
    
    return interpretations[classification] || {
        fullName: classification,
        description: 'Classification interpretation not available',
        recommendations: 'Please consult with a healthcare professional for proper diagnosis and recommendations.'
    };
}

// Get all reports for a specific patient
exports.getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Ensure patient exists
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'patient') {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const reports = await Report.find({ patient: patientId })
            .sort({ createdAt: -1 })
            .select('-image'); // Don't send image data in listing
            
        res.json(reports);
    } catch (error) {
        console.error('Error fetching patient reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// Get a specific report by ID
exports.getReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await Report.findById(reportId);
        
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Add interpretation to the response
        const reportData = report.toObject();
        reportData.interpretations = getClassificationInterpretation(report.classification);
        
        res.json(reportData);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};

// Update a report (add notes, change status)
exports.updateReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { notes, status, doctorId } = req.body;
        
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Update fields if provided
        if (notes !== undefined) report.notes = notes;
        if (status !== undefined) report.status = status;
        
        // Assign doctor if provided
        if (doctorId) {
            const doctor = await User.findById(doctorId);
            if (!doctor || doctor.role !== 'doctor') {
                return res.status(400).json({ error: 'Invalid doctor ID' });
            }
            report.doctor = doctorId;
        }
        
        report.updatedAt = new Date();
        await report.save();
        
        res.json({ 
            message: 'Report updated successfully',
            report
        });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
};
