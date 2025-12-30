const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
	employeeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	employeeName: {
		type: String,
		required: true
	},
	timeFrom: {
		type: String,
		required: true,
		validate: {
			validator: function(v) {
				// Validate time format HH:mm or H:mm
				return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
			},
			message: 'Time format must be HH:mm (e.g., 08:00 or 8:00)'
		}
	},
	timeTo: {
		type: String,
		required: true,
		validate: {
			validator: function(v) {
				return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
			},
			message: 'Time format must be HH:mm (e.g., 16:00 or 8:00)'
		}
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	notes: {
		type: String,
	}
}, { _id: true, timestamps: true });

const scheduleDaySchema = new mongoose.Schema({
	date: {
		type: Date,
		required: true
	},
	entries: [scheduleEntrySchema]
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	teamId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Team',
		required: true
	},
	type: {
		type: String,
		enum: ['team', 'department'],
		required: true
	},
	departmentName: {
		type: String,
		required: function() {
			return this.type === 'department';
		}
	},
	days: [scheduleDaySchema],
	isActive: {
		type: Boolean,
		default: true
	}
}, {
	collection: 'schedules',
	timestamps: true
});

// Indexes for efficient queries
scheduleSchema.index({ teamId: 1, type: 1 });
scheduleSchema.index({ teamId: 1, departmentName: 1 });
scheduleSchema.index({ teamId: 1, name: 1 });

module.exports = conn => (conn.models.Schedule || conn.model('Schedule', scheduleSchema));

