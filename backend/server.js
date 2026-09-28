const { createServer } = require("node:http");
require("dotenv").config();
const { app } = require("./src/app");
const { connectToSocket } = require("./src/controllers/socketManager");
const connectDB = require("./src/config/db");

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
