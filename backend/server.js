import { createServer } from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import { app } from "./src/app.js";
import { connectToSocket } from "./src/controllers/socketManager.js";

dotenv.config();

// Fix for Windows DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore DNS set failure if default DNS is read-only
}

const PORT = process.env.PORT || 8000;
const server = createServer(app);
const io = connectToSocket(server);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
