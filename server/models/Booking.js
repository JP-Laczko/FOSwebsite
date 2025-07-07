import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  coach: { type: String, required: true },
  guardianName: { type: String, required: true },
  athleteName: { type: String, required: true },
  numPlayers: { type: Number, required: true, default: 1 }, 
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  notes: String,
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
