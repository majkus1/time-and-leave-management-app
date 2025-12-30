const mongoose = require('mongoose');

const taskCommentSchema = new mongoose.Schema({
	taskId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Task',
		required: true
	},
	content: {
		type: String,
		required: true,
		trim: true
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	attachments: [{
		filename: String,
		path: String,
		uploadedAt: {
			type: Date,
			default: Date.now
		}
	}],
	isActive: {
		type: Boolean,
		default: true
	}
}, {
	collection: 'taskcomments',
	timestamps: true
});

// Index for efficient queries
taskCommentSchema.index({ taskId: 1, createdAt: -1 });
taskCommentSchema.index({ createdBy: 1 });

module.exports = conn => (conn.models.TaskComment || conn.model('TaskComment', taskCommentSchema));





