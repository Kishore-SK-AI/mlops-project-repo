import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/3age_db';
  try {
    // Attempt standard connection to MongoDB local Compass/daemon
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${uri}`);
    return uri;
  } catch (error) {
    console.warn(`[Database] Standard MongoDB connection failed at ${uri}. Initializing MongoMemoryServer fallback...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Connected to In-Memory MongoDB instance at ${memUri}`);
      return memUri;
    } catch (memErr) {
      console.error('[Database] Failed to start In-Memory MongoDB server:', memErr);
      throw memErr;
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
