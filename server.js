import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "./middlewares/passportConfig.js";
import dotenv from "dotenv";
import http from "http";
import { setupWebSocket } from "./websocket/index.js";
import initDB from "./scripts/initDB.js";

import hostelRoutes from "./routes/hostelRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

setupWebSocket(server);
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
// Apply middlewares in the correct order
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hostels", hostelRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to the Hostel Backend API');
});
const PORT = process.env.PORT || 8188;
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? "mongodb://localhost/test_database"
    : "mongodb+srv://pratik09092001:s4TmGg0OCJIfY7Cj@cluster0.otmde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
    maxPoolSize: 50,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    console.log(`MongoDB URI: ${MONGODB_URI}`);
    await initDB();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
export default app;
