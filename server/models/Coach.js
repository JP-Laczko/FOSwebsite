import mongoose from "mongoose";

const scheduleSubSchema = new mongoose.Schema({
  Monday: { start: Number, end: Number },
  Tuesday: { start: Number, end: Number },
  Wednesday: { start: Number, end: Number },
  Thursday: { start: Number, end: Number },
  Friday: { start: Number, end: Number },
  Saturday: { start: Number, end: Number },
  Sunday: { start: Number, end: Number }
}, { _id: false });

const coachSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },      // for login
  password: { type: String, required: true },                // hashed password
  name: { type: String, required: true, unique: true },          // coach's display name
  schedule: { type: scheduleSubSchema, required: true, default: {
    Monday: { start: 9, end: 22 },
    Tuesday: { start: 9, end: 22 },
    Wednesday: { start: 9, end: 22 },
    Thursday: { start: 9, end: 22 },
    Friday: { start: 9, end: 22 },
    Saturday: { start: 9, end: 22 },
    Sunday: { start: 9, end: 22 }
  }}
});

const Coach = mongoose.model("Coach", coachSchema);
export default Coach;
