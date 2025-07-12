import express from "express";
import Coach from "../models/Coach.js"; 

const router = express.Router();
import bcrypt from 'bcrypt';

// Utility function to reset current day to -1 after midnight
async function resetPastDaysAvailability(coach) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  let hasUpdates = false;
  const updates = {};
  
  // Only reset the current day to -1 if it's not already -1
  const currentDayName = dayNames[currentDay];
  if (coach.schedule && coach.schedule[currentDayName] && 
      (coach.schedule[currentDayName].start !== -1 || coach.schedule[currentDayName].end !== -1)) {
    updates[`schedule.${currentDayName}.start`] = -1;
    updates[`schedule.${currentDayName}.end`] = -1;
    hasUpdates = true;
  }
  
  if (hasUpdates) {
    await Coach.findByIdAndUpdate(coach._id, { $set: updates });
  }
  
  return hasUpdates;
}

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
      const coaches = await Coach.find({}, { name: 1, schedule: 1 });
      
      // Reset past days for all coaches
      for (const coach of coaches) {
        await resetPastDaysAvailability(coach);
      }
      
      // Fetch updated coaches data
      const updatedCoaches = await Coach.find({}, { name: 1, schedule: 1 }).lean();
      res.json(updatedCoaches);
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
  
      // Reset past days availability
      await resetPastDaysAvailability(coach);
      
      // Fetch updated coach data as raw document to check what actually exists
      const updatedCoach = await Coach.findById(req.session.coachId).lean();
      
      // Transform schedule into weeklyAvailability array with dayIndex
      const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const weeklyAvailability = dayNames.map((day, index) => {
        const dayData = updatedCoach.schedule?.[day];
        const dayExists = updatedCoach.schedule && Object.prototype.hasOwnProperty.call(updatedCoach.schedule, day);
        
        // Check if the day actually exists in the raw database document
        if (!dayExists || !dayData) {
          // Day truly missing from database - should show red "No availability"
          return { dayIndex: index, start: null, end: null };
        } else {
          // Day exists in database - return actual values (including -1 for "no availability set")
          return { dayIndex: index, start: dayData.start, end: dayData.end };
        }
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

  if (!remove && (start < 9 || end > 22 || start >= end || start === -1 || end === -1)) {
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

// Development utility route to test -1 availability system
router.post('/dev/force-past-days', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }
  
  try {
    const coaches = await Coach.find({});
    let updatedCount = 0;
    
    for (const coach of coaches) {
      const wasUpdated = await resetPastDaysAvailability(coach);
      if (wasUpdated) updatedCount++;
    }
    
    res.json({ 
      message: `Successfully reset past days for ${updatedCount} coaches`,
      totalCoaches: coaches.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset past days" });
  }
});

// Development utility route to simulate different day scenarios
router.post('/dev/simulate-day', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }
  
  const { targetDay } = req.body; // 0-6, where 0=Sunday, 1=Monday, etc.
  
  if (targetDay === undefined || targetDay < 0 || targetDay > 6) {
    return res.status(400).json({ error: 'targetDay must be 0-6 (0=Sunday, 1=Monday, etc.)' });
  }
  
  try {
    const coaches = await Coach.find({});
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let updatedCount = 0;
    
    for (const coach of coaches) {
      const updates = {};
      let hasUpdates = false;
      
      // Reset all days before targetDay to -1
      for (let i = 0; i < targetDay; i++) {
        const dayName = dayNames[i];
        if (coach.schedule[dayName] && 
            (coach.schedule[dayName].start !== -1 || coach.schedule[dayName].end !== -1)) {
          updates[`schedule.${dayName}.start`] = -1;
          updates[`schedule.${dayName}.end`] = -1;
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        await Coach.findByIdAndUpdate(coach._id, { $set: updates });
        updatedCount++;
      }
    }
    
    res.json({ 
      message: `Simulated ${dayNames[targetDay]} - reset ${updatedCount} coaches' past days`,
      simulatedDay: dayNames[targetDay],
      targetDayIndex: targetDay
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to simulate day" });
  }
});

// Development utility route to fix existing availability data format
router.post('/dev/fix-availability-data', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }
  
  try {
    const coaches = await Coach.find({});
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let updatedCount = 0;
    
    for (const coach of coaches) {
      let hasUpdates = false;
      const updates = {};
      
      // Initialize missing days that should exist but don't
      for (const dayName of dayNames) {
        if (!coach.schedule || !coach.schedule[dayName]) {
          // Day doesn't exist - leave as null (will show orange "No availability set")
          continue;
        }
      }
      
      if (hasUpdates) {
        await Coach.findByIdAndUpdate(coach._id, { $set: updates });
        updatedCount++;
      }
    }
    
    res.json({ 
      message: `Fixed availability data for ${updatedCount} coaches`,
      totalCoaches: coaches.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fix availability data" });
  }
});

export default router;
