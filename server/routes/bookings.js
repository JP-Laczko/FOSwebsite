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
>>>>>>> dev
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
