const mongoose = require('mongoose')

/**
 * Jedno wywołanie modelu = jeden wpis. Liczymy tokeny i szacowany koszt per zespół i ścieżka,
 * żeby decyzje o modelu i cenach dokupów AI opierać na danych, nie na przeczuciu.
 */
const aiUsageLogSchema = new mongoose.Schema(
	{
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		/** data_chat | help | json_draft | schedule_draft | export_intent */
		path: { type: String, required: true },
		/** chat | leave | workday | help — tryb w UI, jeśli dotyczy */
		mode: { type: String, default: null },
		helpModule: { type: String, default: null },
		model: { type: String, required: true },
		promptTokens: { type: Number, default: 0 },
		cachedTokens: { type: Number, default: 0 },
		completionTokens: { type: Number, default: 0 },
		reasoningTokens: { type: Number, default: 0 },
		estimatedCostUsd: { type: Number, default: null },
		durationMs: { type: Number, default: null },
		knowledgeVersion: { type: String, default: null },
		createdAt: { type: Date, default: Date.now },
	},
	{ collection: 'aiusagelogs', timestamps: false }
)

aiUsageLogSchema.index({ teamId: 1, createdAt: -1 })
// 400 dni wystarcza na porównanie rok do roku; starsze wpisy znikają same.
aiUsageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 })

module.exports = conn => conn.models.AiUsageLog || conn.model('AiUsageLog', aiUsageLogSchema)
