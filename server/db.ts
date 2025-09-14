import mongoose from 'mongoose';
import { log } from './vite';

export async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    log('MongoDB connected successfully');
  } catch (error) {
    log('MongoDB connection error:', error);
    process.exit(1);
  }
}