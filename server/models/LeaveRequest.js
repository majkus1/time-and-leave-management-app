const mongoose = require('mongoose')

const leaveRequestSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	type: {
		type: String,
		required: true, // Nie używamy już enum - typy są dynamiczne z Settings
	},
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	daysRequested: { type: Number, required: true },
	replacement: { type: String },
	additionalInfo: { type: String },
	// status: {
	// 	type: String,
	// 	enum: ['Oczekuje na akceptacje', 'Zaakceptowano', 'Odrzucono'],
	// 	default: 'Oczekuje na akceptacje',
	// },
	status: {
		type: String,
		enum: ['status.pending', 'status.accepted', 'status.rejected', 'status.sent'],
		default: 'status.pending'
	  },	  
	createdAt: { type: Date, default: Date.now },
	updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	isProcessed: { type: Boolean, default: false },
})

module.exports = conn => (conn.models.LeaveRequest || conn.model('LeaveRequest', leaveRequestSchema));

