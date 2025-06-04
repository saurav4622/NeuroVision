// Test script to verify config loading
require('dotenv').config();
const { config } = require('./config');

console.log('Testing config loading:');
console.log('JWT_SECRET:', config.JWT_SECRET ? 'LOADED' : 'NOT LOADED');
console.log('MONGODB_URI:', config.MONGODB_URI ? 'LOADED' : 'NOT LOADED');
console.log('PORT:', config.PORT);

if (!config.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is not loaded!');
    process.exit(1);
} else {
    console.log('SUCCESS: All config values loaded correctly');
}
