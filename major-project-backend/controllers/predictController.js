const { spawn } = require('child_process');
const path = require('path');

const predict = async (req, res) => {
    try {
        console.log('Received prediction request');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body image data length:', req.body.image ? req.body.image.length : 'no image field');
        console.log('Request files:', req.files ? 'files present' : 'no files');
        console.log('Request file:', req.file ? `file present: ${req.file.originalname}` : 'no file');
        
        let imageData = null;
        
        // Check if image is uploaded as file
        if (req.file) {
            console.log('Image uploaded as file:', req.file.originalname);
            imageData = req.file.buffer.toString('base64');
        } 
        // Check if image is sent as base64 in body
        else if (req.body.image) {
            console.log('Image received as base64 data');
            imageData = req.body.image;
        }
        
        if (!imageData) {
            console.log('No image data provided');
            console.log('Request body keys:', Object.keys(req.body));
            console.log('Request file:', req.file ? 'present' : 'not present');
            return res.status(400).json({ 
                error: 'No image data provided',
                message: 'Please upload an image file or send base64 image data in the "image" field',
                received: {
                    bodyKeys: Object.keys(req.body),
                    hasFile: !!req.file,
                    bodyImageLength: req.body.image ? req.body.image.length : 0
                }
            });
        }

        console.log('Image data received, processing...');
        console.log('Preparing to run prediction Python script...');
        
        const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
        const pythonScript = path.join(__dirname, '../python/predict.py');

        // Create JSON input for Python script
        const inputData = JSON.stringify({ image: imageData });
        const pythonProcess = spawn(pythonExecutable, [pythonScript, inputData]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log('Python script finished with code:', code);
            console.log('Python script stderr:', errorData);

            try {
                // Extract the last JSON object from stdout
                const jsonObjects = outputData.split('\n').filter(line => {
                    try {
                        JSON.parse(line);
                        return true;
                    } catch {
                        return false;
                    }
                });

                const result = JSON.parse(jsonObjects.pop());
                res.status(200).json(result);
            } catch (err) {
                console.error('Error parsing Python script output:', err);
                res.status(500).json({ error: 'Failed to parse prediction result', details: err.message });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            res.status(500).json({ 
                error: 'Failed to start prediction process',
                details: error.message
            });
        });

    } catch (error) {
        console.error('Error during prediction:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
};

module.exports = {
    predict
};
