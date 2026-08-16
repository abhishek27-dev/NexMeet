import express from "express";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes Declaration
app.use("/api/v1/users", userRoutes);

// Base Route
app.get("/", (req, res) => {
  return res.json({ hello: "world" });
});

export { app };
