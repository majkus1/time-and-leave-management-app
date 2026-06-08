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
	reviewStatus: {
		type: String,
		enum: ['approved', 'rejected'],
		default: null,
	},
	reviewedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		default: null,
	},
	reviewedAt: {
		type: Date,
		default: null,
	},
	lastChangedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		default: null,
	},
	manualActivityBlocks: [{
		activityId: {
			type: String,
			required: true,
		},
		activityName: {
			type: String,
			default: '',
		},
		activityNameEn: {
			type: String,
			default: '',
		},
		activityGroup: {
			type: String,
			default: '',
		},
		hours: {
			type: Number,
			required: true,
			min: 0,
			max: 24,
		},
		timeFrom: {
			type: String,
			default: null,
		},
		timeTo: {
			type: String,
			default: null,
		},
		quantity: {
			type: Number,
			default: null,
			min: 0,
		},
		unit: {
			type: String,
			default: '',
		},
	}],
	manualTaskBlocks: [{
		taskId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Task',
			required: true,
		},
		taskTitle: {
			type: String,
			default: '',
		},
		hours: {
			type: Number,
			required: true,
			min: 0,
			max: 24,
		},
		timeFrom: {
			type: String,
			default: null,
		},
		timeTo: {
			type: String,
			default: null,
		},
	}],
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
		},
		activityId: {
			type: String,
			default: null
		},
		activityName: {
			type: String,
			default: ''
		},
		activityNameEn: {
			type: String,
			default: ''
		},
		activityGroup: {
			type: String,
			default: ''
		},
		quantity: {
			type: Number,
			default: null,
			min: 0
		},
		unit: {
			type: String,
			default: ''
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
		},
		activityId: {
			type: String,
			default: null
		}
	}
}, { timestamps: true })

module.exports = conn => conn.models.Workday || conn.model('Workday', workdaySchema)
