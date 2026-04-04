const mongoose = require('mongoose')

const userNotificationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Team',
			required: true,
			index: true,
		},
		channel: {
			type: String,
			enum: ['push', 'email'],
			required: true,
		},
		category: {
			type: String,
			default: 'general',
		},
		title: {
			type: String,
			required: true,
			maxlength: 500,
		},
		body: {
			type: String,
			default: '',
			maxlength: 4000,
		},
		link: {
			type: String,
			default: null,
		},
		readAt: {
			type: Date,
			default: null,
			index: true,
		},
	},
	{ timestamps: true, collection: 'userNotifications' }
)

userNotificationSchema.index({ userId: 1, createdAt: -1 })
userNotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 })

module.exports = conn => conn.models.UserNotification || conn.model('UserNotification', userNotificationSchema)
