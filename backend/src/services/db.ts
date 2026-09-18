import mongoose from 'mongoose';
import { logger } from '../utils/logger.ts';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    logger.warn('MONGODB_URI environment variable is not defined. Running in resilient local JSON storage mode.');
    return false;
  }

  try {
    logger.info('Connecting to MongoDB database...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 7000
    });

    isConnected = true;
    logger.info('Successfully connected to MongoDB.');
    return true;
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB:', err.message);
    logger.warn('Falling back to local persistent JSON storage.');
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
