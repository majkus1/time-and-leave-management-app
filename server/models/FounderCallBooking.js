const mongoose = require('mongoose')

/** Rezerwacja rozmowy wdrożeniowej z założycielem — jeden slot (start) może mieć jedną rezerwację w całej aplikacji. */
const founderCallBookingSchema = new mongoose.Schema(
	{
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		slotStart: { type: Date, required: true },
		slotEnd: { type: Date, required: true },
		name: { type: String, default: '', trim: true, maxlength: 120 },
		email: { type: String, default: '', trim: true, lowercase: true, maxlength: 320 },
		phone: { type: String, default: '', trim: true, maxlength: 32 },
		note: { type: String, default: '', trim: true, maxlength: 600 },
		status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
	},
	{ timestamps: true, collection: 'foundercallbookings' }
)

// Jeden termin = jedna rozmowa (globalnie); anulowane nie blokują slotu.
founderCallBookingSchema.index(
	{ slotStart: 1 },
	{ unique: true, partialFilterExpression: { status: 'booked' } }
)

module.exports = conn => conn.models.FounderCallBooking || conn.model('FounderCallBooking', founderCallBookingSchema)
