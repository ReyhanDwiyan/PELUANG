const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
  // Jika sudah connect, skip
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // ...existing options...
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;