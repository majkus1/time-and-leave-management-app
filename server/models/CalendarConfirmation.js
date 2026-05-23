const mongoose = require("mongoose");

const CalendarConfirmationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  isConfirmed: { type: Boolean, default: false },
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = conn => (conn.models.CalendarConfirmation || conn.model('CalendarConfirmation', CalendarConfirmationSchema));
