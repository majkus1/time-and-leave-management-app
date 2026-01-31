const mongoose = require('mongoose')

const workdaySchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	hoursWorked: {
		type: Number,
	},
	additionalWorked: {
		type: Number,
	},
	realTimeDayWorked: {
		type: String,
	},
	absenceType: {
		type: String,
	},
	notes: {
		type: String,
	},
	timeEntries: [{
		startTime: {
			type: Date,
			required: true
		},
		endTime: {
			type: Date,
			default: null
		},
		isBreak: {
			type: Boolean,
			default: false
		},
		breakTime: {
			type: Number,
			default: 0
		},
		isOvertime: {
			type: Boolean,
			default: false
		},
		overtimeTime: {
			type: Number,
			default: 0
		},
		workDescription: {
			type: String,
			default: ''
		},
		taskId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Task',
			default: null
		},
		qrCodeId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'QRCode',
			default: null
		}
	}],
	activeTimer: {
		startTime: {
			type: Date,
			default: null
		},
		isBreak: {
			type: Boolean,
			default: false
		},
		breakStartTime: {
			type: Date,
			default: null
		},
		totalBreakTime: {
			type: Number,
			default: 0
		},
		isOvertime: {
			type: Boolean,
			default: false
		},
		overtimeStartTime: {
			type: Date,
			default: null
		},
		totalOvertimeTime: {
			type: Number,
			default: 0
		},
		workDescription: {
			type: String,
			default: ''
		},
		taskId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Task',
			default: null
		},
		qrCodeId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'QRCode',
			default: null
		}
	}
})

module.exports = conn => conn.models.Workday || conn.model('Workday', workdaySchema)
