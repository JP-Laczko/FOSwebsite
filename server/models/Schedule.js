import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  coachName: { type: String, required: true, unique: true },
  schedule: {
    Monday: { start: Number, end: Number },
    Tuesday: { start: Number, end: Number },
    Wednesday: { start: Number, end: Number },
    Thursday: { start: Number, end: Number },
    Friday: { start: Number, end: Number },
    Saturday: { start: Number, end: Number },
    Sunday: { start: Number, end: Number }
  }
});

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;
