const mongoose = require('mongoose')

const announcementAttachmentSchema = new mongoose.Schema(
	{
		filename: {
			type: String,
			required: true,
		},
		path: {
			type: String,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
	},
	{ _id: false }
)

const announcementSchema = new mongoose.Schema(
	{
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Team',
			required: true,
			index: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 180,
		},
		content: {
			type: String,
			required: true,
			trim: true,
			maxlength: 5000,
		},
		attachments: {
			type: [announcementAttachmentSchema],
			default: [],
		},
		targetScope: {
			type: String,
			enum: ['all', 'department', 'users'],
			required: true,
			default: 'all',
			index: true,
		},
		targetDepartment: {
			type: String,
			default: null,
			trim: true,
		},
		targetUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
		collection: 'announcements',
	}
)

announcementSchema.index({ teamId: 1, createdAt: -1 })
announcementSchema.index({ teamId: 1, targetScope: 1, targetDepartment: 1 })

module.exports = (conn) => conn.models.Announcement || conn.model('Announcement', announcementSchema)
