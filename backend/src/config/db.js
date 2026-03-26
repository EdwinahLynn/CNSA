const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { bufferCommands: false });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB not available: ${error.message}`);
    console.warn('Running without database — mock data only.');
  }
};

module.exports = connectDB;
