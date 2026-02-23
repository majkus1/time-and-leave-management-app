const mongoose = require('mongoose')

const taskViewStateSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true,
	},
	taskId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task',
		required: true,
	},
	lastViewedAt: {
		type: Date,
		default: Date.now,
	},
	lastModalViewedAt: {
		type: Date,
		default: Date.now,
	},
}, {
	collection: 'taskviewstates',
	timestamps: true,
})

taskViewStateSchema.index({ userId: 1, taskId: 1 }, { unique: true })
taskViewStateSchema.index({ userId: 1, boardId: 1 })
taskViewStateSchema.index({ taskId: 1, userId: 1 })

module.exports = conn => (conn.models.TaskViewState || conn.model('TaskViewState', taskViewStateSchema))

