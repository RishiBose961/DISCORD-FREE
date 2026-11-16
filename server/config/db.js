const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/discordx';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    console.error('[Database Error] Please ensure MongoDB is running at:', uri);
    console.error('[Database Error] You can start local MongoDB or set MONGODB_URI in server/.env');
    // Do not crash the entire process immediately, allow reconnection attempts
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
