const mongoose = require('mongoose')

const appSessionSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
		username: { type: String, maxlength: 320 },
		startedAt: { type: Date, required: true, index: true },
		lastSeenAt: { type: Date, required: true, index: true },
		endedAt: { type: Date, default: null, index: true },
		ipHash: { type: String, maxlength: 32 },
		userAgent: { type: String, maxlength: 200 },
	},
	{ collection: 'appsessions', timestamps: false }
)

appSessionSchema.index({ endedAt: 1, lastSeenAt: -1 })
appSessionSchema.index({ teamId: 1, lastSeenAt: -1 })

module.exports = conn => conn.models.AppSession || conn.model('AppSession', appSessionSchema)
