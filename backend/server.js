import { createServer } from "node:http";
import dotenv from "dotenv";
import { app } from "./src/app.js";
import { connectToSocket } from "./src/controllers/socketManager.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const server = createServer(app);
const io = connectToSocket(server);

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();

