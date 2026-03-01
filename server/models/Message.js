const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
	channelId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Channel',
		required: true
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	content: {
		type: String,
		required: false,
		default: '',
		trim: true,
		maxlength: 2000
	},
	attachments: [{
		filename: {
			type: String,
			required: true
		},
		path: {
			type: String,
			required: true
		},
		mimeType: {
			type: String,
			required: true
		},
		size: {
			type: Number,
			required: true
		}
	}],
	isEdited: {
		type: Boolean,
		default: false
	},
	editedAt: {
		type: Date,
		default: null
	},
	isDeleted: {
		type: Boolean,
		default: false
	},
	deletedAt: {
		type: Date,
		default: null
	},
	readBy: [{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		readAt: {
			type: Date,
			default: Date.now
		}
	}]
}, {
	collection: 'messages',
	timestamps: true
});

// Index for efficient queries
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ 'readBy.userId': 1 });

module.exports = conn => (conn.models.Message || conn.model('Message', messageSchema));
























