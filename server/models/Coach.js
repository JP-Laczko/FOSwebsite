import mongoose from "mongoose";

const scheduleSubSchema = new mongoose.Schema({
  Monday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } },
  Tuesday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } },
  Wednesday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } },
  Thursday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } },
  Friday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } },
  Saturday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } },
  Sunday: { start: { type: Number, default: -1 }, end: { type: Number, default: -1 } }
}, { _id: false });

const coachSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },      // for login
  password: { type: String, required: true },                    // password
  name: { type: String, required: true, unique: true },          // coach's display name
  sport: { type: String, required: true },                       // e.g., "baseball", "softball"
  position: { type: String, default: "" },                       // e.g., "Pitcher"
  school: { type: String, default: "" },                         // e.g., "Rutgers University"
  achievement: { type: String, default: "" },                    // e.g., "All-Conference"
  bio: {
    text: { type: String, default: "" },
    performance: { type: Map, of: String, default: {} }          // e.g., { "Career Pitching Stats": "3.2 ERA" }
  },
  image: { type: String, default: "" },                          // URL to coach image
  email: { type: String, default: "" },                          // coach email for notifications
  instagram: { type: String, default: "" },                      // instagram profile URL
  available: { type: String, enum: ["yes", "no"], default: "yes" }, // is coach available for bookings
  schedule: { type: scheduleSubSchema, required: true, default: {
    Monday: { start: -1, end: -1 },
    Tuesday: { start: -1, end: -1 },
    Wednesday: { start: -1, end: -1 },
    Thursday: { start: -1, end: -1 },
    Friday: { start: -1, end: -1 },
    Saturday: { start: -1, end: -1 },
    Sunday: { start: -1, end: -1 }
  }}
}, { timestamps: true });

const Coach = mongoose.model("Coach", coachSchema);
export default Coach;
