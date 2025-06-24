const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Booking = require('./models/Booking');

// Instance of express app set port from environment or default to 5000
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Test Route
app.get("/", (req, res) => {
  res.send("FOS Backend is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

/* Endpoints */
// Get all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new booking
app.post("/api/bookings", async (req, res) => {
  const booking = new Booking({
    coach: req.body.coach,
    athleteName: req.body.athleteName,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    status: req.body.status || 'booked',
    notes: req.body.notes || '',
  });

  try {
    const newBooking = await booking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

