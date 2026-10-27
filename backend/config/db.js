const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-gig-marketplace';

  try {
    // Attempt standard connection with 2s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected to database: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB] Primary connection failed (${err.message}). Attempting in-memory database fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] In-memory MongoDB server started & connected at: ${memoryUri}`);
    } catch (memErr) {
      console.error(`[MongoDB] Failed to connect to database:`, memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
