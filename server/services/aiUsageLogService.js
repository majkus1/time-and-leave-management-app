const { firmDb } = require('../db/db')
const AiUsageLog = require('../models/AiUsageLog')(firmDb)
const { normalizeUsage, estimateCostUsd } = require('../constants/openaiPricing')

/**
 * Zapis użycia modelu — w tle, nigdy nie rzuca. Brak `usage` (np. błąd upstream) = brak wpisu.
 *
 * @param {object} p
 * @param {string} p.teamId
 * @param {string} [p.userId]
 * @param {string} p.path data_chat | help | json_draft | schedule_draft | export_intent
 * @param {string} [p.mode]
 * @param {string} [p.helpModule]
 * @param {string} p.model
 * @param {object} p.usage surowe `usage` z OpenAI
 * @param {number} [p.durationMs]
 * @param {string} [p.knowledgeVersion]
 */
function recordAiUsage(p) {
	if (!p || !p.teamId || !p.model || !p.usage) return
	const tokens = normalizeUsage(p.usage)
	void AiUsageLog.create({
		teamId: p.teamId,
		userId: p.userId || null,
		path: p.path,
		mode: p.mode || null,
		helpModule: p.helpModule || null,
		model: p.model,
		...tokens,
		estimatedCostUsd: estimateCostUsd(p.model, p.usage),
		durationMs: Number.isFinite(p.durationMs) ? Math.round(p.durationMs) : null,
		knowledgeVersion: p.knowledgeVersion || null,
	}).catch(err => {
		console.error('[aiUsageLog]', err?.message || err)
	})
}

module.exports = { recordAiUsage }
