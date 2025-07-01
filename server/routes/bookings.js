import express from "express";
import Booking from "../models/Booking.js"; // Adjust path & model name accordingly

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("➡️ GET /api/bookings triggered");
    console.log("Session in bookings GET:", req.session);

    const bookings = await Booking.find();
    console.log(`✅ Found ${bookings.length} bookings`);

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error in GET /api/bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("➡️ POST /api/bookings triggered");
    console.log("Session in bookings POST:", req.session);
    console.log("Booking data received:", req.body);

    const newBooking = new Booking(req.body);
    const savedBooking = await newBooking.save();

    console.log("✅ Booking saved:", savedBooking._id);
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("❌ Error in POST /api/bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    console.log(`➡️ DELETE /api/bookings/${req.params.id} triggered`);
    console.log("Session in bookings DELETE:", req.session);

    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (deleted) {
      console.log("✅ Booking deleted:", req.params.id);
      res.json({ message: "Booking deleted" });
    } else {
      console.log("⚠️ Booking not found:", req.params.id);
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    console.error("❌ Error in DELETE /api/bookings/:id:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

export default router;
