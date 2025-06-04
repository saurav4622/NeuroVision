const multer = require('multer');

// Configure multer to store files in memory as Buffer
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}); // Export multer instance

module.exports = upload;
