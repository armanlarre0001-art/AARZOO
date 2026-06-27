const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drip_kicks';
  try {
    console.log(`Connecting to MongoDB at: ${uri}...`);
    // Connect with a 3-second timeout so we don't hang if MongoDB is not running
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected successfully to ${conn.connection.host}`);
    isConnected = true;
  } catch (err) {
    console.warn(`[WARNING] MongoDB Connection failed: ${err.message}`);
    console.warn(`[INFO] Falling back to local JSON database storage under 'data/' folder.`);
    isConnected = false;
  }
}

function getIsConnected() {
  return isConnected;
}

module.exports = { connectDB, getIsConnected };
