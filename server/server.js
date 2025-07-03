import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import bookingRoutes from "./routes/bookings.js"; // adjust path as needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "https://fossportsacademy.com",
  "https://www.fossportsacademy.com",
  "https://fos-website.onrender.com",
];

// CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`❌ CORS - Origin NOT allowed: ${origin}`);
    callback(new Error("CORS policy: Origin not allowed"));
  },
  credentials: true,
}));

const isProduction = process.env.NODE_ENV === "production";
app.set("trust proxy", 1);

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction, // true in production, false locally
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60,
  },
}));

// JSON parser
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Auth middleware
function checkAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  } else {
    console.log("❌ Unauthorized session");
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Admin login route
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ message: "Login successful" });
  } else {
    console.log("❌ Invalid password attempt");
    res.status(401).json({ message: "Invalid password" });
  }
});

// Use booking routes protected by auth middleware
app.use("/api/bookings", bookingRoutes);

// Static files
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
