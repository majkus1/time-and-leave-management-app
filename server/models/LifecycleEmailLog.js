const mongoose = require('mongoose')

/** Dziennik maili cyklu życia zespołu — jeden wpis na (zespół, rodzaj) chroni przed dublem. */
const lifecycleEmailLogSchema = new mongoose.Schema(
	{
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
		kind: { type: String, required: true },
		to: { type: String, default: '' },
		sentAt: { type: Date, default: Date.now },
	},
	{ collection: 'lifecycleemaillogs', timestamps: false }
)

lifecycleEmailLogSchema.index({ teamId: 1, kind: 1 }, { unique: true })

module.exports = conn => conn.models.LifecycleEmailLog || conn.model('LifecycleEmailLog', lifecycleEmailLogSchema)
