const mongoose = require('mongoose')

const emailNotificationPreferenceSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
			index: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Team',
			required: true,
			index: true,
		},
		preferences: {
			chat: { type: Boolean, default: true },
			tasks: { type: Boolean, default: true },
			taskStatusChanges: { type: Boolean, default: true },
			taskComments: { type: Boolean, default: true },
			leaves: { type: Boolean, default: true },
			announcements: { type: Boolean, default: true },
			schedulePublished: { type: Boolean, default: true },
		},
	},
	{
		collection: 'emailNotificationPreferences',
		timestamps: true,
	}
)

emailNotificationPreferenceSchema.index({ userId: 1, teamId: 1 })

module.exports = (conn) =>
	conn.models.EmailNotificationPreference || conn.model('EmailNotificationPreference', emailNotificationPreferenceSchema)
