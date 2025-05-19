import mongoose from "mongoose";
import { config } from "dotenv";

// Load environment variables
config();

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/algomancy";

// Global variable to track connection status
let isConnected = false;

/**
 * Connect to MongoDB
 * @returns {Object} Object containing the MongoDB database instance
 */
export async function connectToDatabase() {
  if (isConnected) {
    return { db: mongoose.connection.db };
  }

  try {
    const mongooseConnection = await mongoose.connect(MONGODB_URI);
    isConnected = !!mongooseConnection.connections[0].readyState;
    return { db: mongoose.connection.db };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
}

export default mongoose;
