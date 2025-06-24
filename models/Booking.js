const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  coach: { type: String, required: true },
  athleteName: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // or use Date with time
  endTime: { type: String, required: true },
  status: { type: String, default: 'booked' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
