import express from "express";
import Coach from "../models/Coach.js"; 

const router = express.Router();
import bcrypt from 'bcrypt';

function requireCoachLogin(req, res, next) {
  if (req.session && req.session.coachId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const coach = await Coach.findOne({ username });
    if (!coach) return res.status(401).json({ message: 'Invalid username or password' });

    // Compare plain text password instead of bcrypt
    if (password !== coach.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Set session
    req.session.coachId = coach._id;
    req.session.coachName = coach.name;

    res.json({ message: 'Login successful', coachName: coach.name });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

  router.get('/login', (req, res) => {
    res.json({ message: "This is the login GET endpoint" });
  });

  router.get('/schedules', async (req, res) => {
    try {
      const coaches = await Coach.find({}, { name: 1, schedule: 1 }).lean();
      res.json(coaches);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  router.get('/schedule', requireCoachLogin, async (req, res) => {
    try {
      const coach = await Coach.findById(req.session.coachId);
      if (!coach) return res.status(404).json({ message: "Coach not found" });
  
      res.json({ schedule: coach.schedule });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  router.get('/availability', requireCoachLogin, async (req, res) => {
    try {
      const coach = await Coach.findById(req.session.coachId);
      if (!coach) return res.status(404).json({ message: "Coach not found" });
  
      // Transform schedule into weeklyAvailability array with dayIndex
      const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const weeklyAvailability = dayNames.map((day, index) => {
        const { start, end } = coach.schedule[day];
        return { dayIndex: index, start, end };
      });
  
      res.json({ weeklyAvailability });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });  
  
  router.get('/schedule', (req, res) => {
    // return schedule data
    res.json({ message: 'Schedule route protected and working!' });
  });

router.post("/updateScheduleDay", async (req, res) => {
  const { coachName, day, start, end, remove } = req.body;

  if (!coachName || !day) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (start < 9 || end > 22 || start >= end) {
    return res.status(400).json({ error: "Invalid time range. Must be between 9AM and 10PM." });
  }

  try {
    const update = remove
      ? { $unset: { [`schedule.${day}`]: "" } }
      : { $set: { [`schedule.${day}`]: { start, end } } };

    const updatedCoach = await Coach.findOneAndUpdate(
      { name: coachName },
      update,
      { new: true }
    );

    if (!updatedCoach) {
      return res.status(404).json({ error: "Coach not found." });
    }

    res.json({
      message: remove
        ? `Removed availability for ${day}`
        : "Schedule updated successfully",
      schedule: updatedCoach.schedule,
    });
  } catch (err) {
    console.error("❌ Error updating schedule:", err);
    res.status(500).json({ error: "Server error while updating schedule." });
  }
});

export default router;
