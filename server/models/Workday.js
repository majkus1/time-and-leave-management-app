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
})

module.exports = conn => conn.models.Workday || conn.model('Workday', workdaySchema)
