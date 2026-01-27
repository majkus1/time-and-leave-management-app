const mongoose = require('mongoose')

const timeEntrySchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	qrCodeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'QRCode',
		required: true
	},
	entryTime: {
		type: Date,
		required: true
	},
	exitTime: {
		type: Date,
		default: null
	},
	date: {
		type: Date,
		required: true,
		index: true
	},
	isOvertime: {
		type: Boolean,
		default: false
	},
	workDescription: {
		type: String,
		default: ''
	},
	taskId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task',
		default: null
	}
}, {
	timestamps: true
})

// Index for efficient queries
timeEntrySchema.index({ userId: 1, date: -1 })
timeEntrySchema.index({ qrCodeId: 1, date: -1 })

module.exports = conn => conn.models.TimeEntry || conn.model('TimeEntry', timeEntrySchema)
