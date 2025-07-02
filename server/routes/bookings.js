import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

// GET all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST a new booking
router.post("/", async (req, res) => {
  const booking = new Booking(req.body);
  try {
    const newBooking = await booking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/check', async (req, res) => {
  const { coach, datetime } = req.body;

  try {
    const bookingTime = new Date(datetime);

    const conflict = await Booking.findOne({
      coach,
      date: bookingTime.toISOString()
    });

    if (conflict) {
      return res.json({ available: false });
    }

    return res.json({ available: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE a booking
router.delete("/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH (Edit) a booking
router.patch("/:id", async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(updatedBooking);
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(400).json({ message: err.message });
  }
});

// GET bookings for a specific coach within a date range
router.get("/:coach", async (req, res) => {
  const { coach } = req.params;
  const { start, end } = req.query;

  try {
    const bookings = await Booking.find({
      coach,
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    });

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

export default router;
