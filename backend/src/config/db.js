import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  try {
    // Fix for Windows DNS resolution for MongoDB Atlas SRV records
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e) {
      // Ignore DNS set failure if default DNS is read-only
    }

    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully! DB Host: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
