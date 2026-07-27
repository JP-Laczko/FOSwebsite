import express from "express";
import Coach from "../models/Coach.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
import bcrypt from 'bcrypt';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
});

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

// ============================================
// ADMIN COACH MANAGEMENT ENDPOINTS
// ============================================

// Middleware to check admin session
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ message: 'Admin authentication required' });
}

// POST upload coach image (admin) - uploads to Cloudinary
router.post('/admin/upload-image', requireAdmin, (req, res) => {
  upload.single('image')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'fos-coaches',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      res.json({
        message: 'Image uploaded successfully',
        imagePath: result.secure_url
      });
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });
});

// GET all coaches (full data for admin)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const coaches = await Coach.find({}).select('-password').sort({ name: 1 });
    res.json(coaches);
  } catch (err) {
    console.error('Error fetching coaches:', err);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

// GET all coaches (public - for frontend to replace Gist)
router.get('/all', async (req, res) => {
  try {
    const coaches = await Coach.find({}).select('-password -username').sort({ name: 1 });
    res.json(coaches);
  } catch (err) {
    console.error('Error fetching coaches:', err);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

// GET single coach by ID (admin)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id).select('-password');
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    res.json(coach);
  } catch (err) {
    console.error('Error fetching coach:', err);
    res.status(500).json({ error: 'Failed to fetch coach' });
  }
});

// POST create new coach (admin)
router.post('/admin/create', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, sport, position, school, achievement, bio, image, email, instagram, available } = req.body;

    // Validate required fields
    if (!username || !password || !name || !sport) {
      return res.status(400).json({ error: 'Username, password, name, and sport are required' });
    }

    // Check if username or name already exists
    const existingCoach = await Coach.findOne({ $or: [{ username }, { name }] });
    if (existingCoach) {
      return res.status(400).json({ error: 'A coach with this username or name already exists' });
    }

    const newCoach = new Coach({
      username,
      password, // Note: In production, you should hash this
      name,
      sport,
      position: position || '',
      school: school || '',
      achievement: achievement || '',
      bio: bio || { text: '', performance: {} },
      image: image || '',
      email: email || '',
      instagram: instagram || '',
      available: available || 'yes'
    });

    await newCoach.save();

    // Return coach without password
    const savedCoach = await Coach.findById(newCoach._id).select('-password');
    res.status(201).json(savedCoach);
  } catch (err) {
    console.error('Error creating coach:', err);
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

// PATCH update coach (admin)
router.patch('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, sport, position, school, achievement, bio, image, email, instagram, available } = req.body;

    const coach = await Coach.findById(req.params.id);
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    // Check if new username or name conflicts with another coach
    if (username && username !== coach.username) {
      const existingUsername = await Coach.findOne({ username, _id: { $ne: req.params.id } });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      coach.username = username;
    }

    if (name && name !== coach.name) {
      const existingName = await Coach.findOne({ name, _id: { $ne: req.params.id } });
      if (existingName) {
        return res.status(400).json({ error: 'Coach name already exists' });
      }
      coach.name = name;
    }

    // Update fields if provided
    if (password) coach.password = password;
    if (sport) coach.sport = sport;
    if (position !== undefined) coach.position = position;
    if (school !== undefined) coach.school = school;
    if (achievement !== undefined) coach.achievement = achievement;
    if (bio !== undefined) coach.bio = bio;
    if (image !== undefined) coach.image = image;
    if (email !== undefined) coach.email = email;
    if (instagram !== undefined) coach.instagram = instagram;
    if (available !== undefined) coach.available = available;

    await coach.save();

    const updatedCoach = await Coach.findById(req.params.id).select('-password');
    res.json(updatedCoach);
  } catch (err) {
    console.error('Error updating coach:', err);
    res.status(500).json({ error: 'Failed to update coach' });
  }
});

// DELETE coach (admin)
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    res.json({ message: 'Coach deleted successfully', deletedCoach: coach.name });
  } catch (err) {
    console.error('Error deleting coach:', err);
    res.status(500).json({ error: 'Failed to delete coach' });
  }
});

// POST import coaches from Gist (admin - one-time migration)
router.post('/admin/import-from-gist', requireAdmin, async (req, res) => {
  try {
    const gistUrl = 'https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json';

    const response = await fetch(gistUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Gist data');
    }

    const gistCoaches = await response.json();

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    for (const gistCoach of gistCoaches) {
      // Check if coach already exists by name
      const existingCoach = await Coach.findOne({ name: gistCoach.name });

      if (existingCoach) {
        // Update existing coach with Gist data (but keep credentials and schedule)
        existingCoach.sport = gistCoach.sport || existingCoach.sport;
        existingCoach.position = gistCoach.position || existingCoach.position;
        existingCoach.school = gistCoach.school || existingCoach.school;
        existingCoach.achievement = gistCoach.achievement || existingCoach.achievement;
        existingCoach.bio = gistCoach.bio || existingCoach.bio;
        existingCoach.image = gistCoach.image || existingCoach.image;
        existingCoach.email = gistCoach.email || existingCoach.email;
        existingCoach.instagram = gistCoach.instagram || existingCoach.instagram;
        existingCoach.available = gistCoach.available || existingCoach.available;
        await existingCoach.save();
        updated++;
      } else {
        // Create new coach with default credentials
        const username = gistCoach.name.toLowerCase().replace(/\s+/g, '_');
        const defaultPassword = 'changeme123'; // They should change this

        const newCoach = new Coach({
          username,
          password: defaultPassword,
          name: gistCoach.name,
          sport: gistCoach.sport || 'baseball',
          position: gistCoach.position || '',
          school: gistCoach.school || '',
          achievement: gistCoach.achievement || '',
          bio: gistCoach.bio || { text: '', performance: {} },
          image: gistCoach.image || '',
          email: gistCoach.email || '',
          instagram: gistCoach.instagram || '',
          available: gistCoach.available || 'yes'
        });

        await newCoach.save();
        imported++;
      }
    }

    res.json({
      message: 'Import completed',
      imported,
      updated,
      skipped,
      total: gistCoaches.length
    });
  } catch (err) {
    console.error('Error importing from Gist:', err);
    res.status(500).json({ error: 'Failed to import coaches from Gist' });
  }
});

export default router;
