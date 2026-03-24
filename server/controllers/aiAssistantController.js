const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { runAssistantTurn, iterateAssistantTurnStream, isOpenAIConfigured } = require('../services/aiAssistantService')
const { buildAiIntentExportBuffer } = require('../services/aiExportFileService')
const { runLeaveDraftTurn } = require('../services/aiLeaveDraftService')
const { runWorkdayDraftTurn } = require('../services/aiWorkdayDraftService')
const entitlementsService = require('../services/entitlementsService')

exports.getStatus = async (req, res) => {
	try {
		const team = await Team.findById(req.user.teamId)
		const ent = team ? entitlementsService.buildClientEntitlements(team) : null
		res.json({
			enabled: isOpenAIConfigured(),
			aiEntitlements: ent?.ai ?? null,
		})
	} catch (e) {
		res.status(500).json({ error: 'Status check failed' })
	}
}

exports.chat = async (req, res) => {
	try {
		const { messages, periodPreset, dateFrom, dateTo, locale } = req.body || {}

		await entitlementsService.assertAiMessageAllowedForUser(req.user.userId)
		const result = await runAssistantTurn({
			userId: req.user.userId,
			messages,
			periodPreset,
			dateFrom,
			dateTo,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)

		res.json({
			reply: result.reply,
			model: result.model,
			meta: result.meta,
			usage: result.usage,
		})
	} catch (err) {
		if (err.code === 'AI_QUOTA_EXCEEDED' || err.code === 'AI_DISABLED_NO_SUBSCRIPTION') {
			return res.status(403).json({ error: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_NOT_CONFIGURED') {
			return res.status(503).json({
				error: err.message,
				code: err.code,
			})
		}
		if (err.code === 'VALIDATION' || err.code === 'USER_INVALID') {
			return res.status(400).json({ error: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_HTTP_ERROR') {
			return res.status(502).json({
				error: err.message,
				code: err.code,
				status: err.status,
			})
		}
		console.error('aiAssistantController.chat:', err)
		res.status(500).json({ error: 'AI assistant request failed' })
	}
}

/**
 * SSE stream: same body as POST /chat. Events JSON in `data:` lines:
 * { type: 'meta', meta }, { type: 'delta', text }, { type: 'end', model }, { type: 'error', code?, message }
 */
exports.chatStream = async (req, res) => {
	const writeSse = obj => {
		res.write(`data: ${JSON.stringify(obj)}\n\n`)
	}

	try {
		res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
		res.setHeader('Cache-Control', 'no-cache, no-transform')
		res.setHeader('Connection', 'keep-alive')
		res.setHeader('X-Accel-Buffering', 'no')
		if (typeof res.flushHeaders === 'function') {
			res.flushHeaders()
		}

		const { messages, periodPreset, dateFrom, dateTo, locale } = req.body || {}

		await entitlementsService.assertAiMessageAllowedForUser(req.user.userId)
		for await (const ev of iterateAssistantTurnStream({
			userId: req.user.userId,
			messages,
			periodPreset,
			dateFrom,
			dateTo,
			locale,
		})) {
			writeSse(ev)
		}
		try {
			await entitlementsService.consumeAiMessageForUser(req.user.userId)
		} catch (consumeErr) {
			writeSse({
				type: 'error',
				code: consumeErr.code || 'AI_CONSUME_FAILED',
				message: consumeErr.message || 'Could not finalize AI usage',
			})
		}
		res.end()
	} catch (err) {
		if (!res.headersSent) {
			if (err.code === 'AI_QUOTA_EXCEEDED' || err.code === 'AI_DISABLED_NO_SUBSCRIPTION') {
				return res.status(403).json({ error: err.message, code: err.code })
			}
			if (err.code === 'OPENAI_NOT_CONFIGURED') {
				return res.status(503).json({
					error: err.message,
					code: err.code,
				})
			}
			if (err.code === 'VALIDATION' || err.code === 'USER_INVALID') {
				return res.status(400).json({ error: err.message, code: err.code })
			}
			if (err.code === 'OPENAI_HTTP_ERROR' || err.code === 'OPENAI_STREAM_ERROR') {
				return res.status(502).json({
					error: err.message,
					code: err.code,
					status: err.status,
				})
			}
			console.error('aiAssistantController.chatStream:', err)
			return res.status(500).json({ error: 'AI assistant request failed' })
		}

		try {
			writeSse({
				type: 'error',
				code: err.code || 'UNKNOWN',
				message: err.message || 'AI assistant stream failed',
			})
		} catch (writeErr) {
			console.error('aiAssistantController.chatStream write error:', writeErr)
		}
		res.end()
	}
}

/**
 * POST body: format ('xlsx'|'pdf'), periodPreset, dateFrom?, dateTo?, locale?,
 * reportType, leaveStatuses?, scopeTarget, departmentHint? — must match a prior exportOffer; re-validated against DB.
 */
/**
 * POST body: { messages, locale } — draft leave request from chat (preview; submit via /api/leaveworks/leave-request).
 */
exports.leaveDraft = async (req, res) => {
	try {
		const { messages, locale } = req.body || {}
		await entitlementsService.assertAiMessageAllowedForUser(req.user.userId)
		const result = await runLeaveDraftTurn({
			userId: req.user.userId,
			messages,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)
		res.json({
			reply: result.reply,
			draft: result.draft,
			draftError: result.draftError,
			model: result.model,
			usage: result.usage,
		})
	} catch (err) {
		if (err.code === 'AI_QUOTA_EXCEEDED' || err.code === 'AI_DISABLED_NO_SUBSCRIPTION') {
			return res.status(403).json({ error: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_NOT_CONFIGURED') {
			return res.status(503).json({
				error: err.message,
				code: err.code,
			})
		}
		if (err.code === 'VALIDATION' || err.code === 'USER_INVALID') {
			return res.status(400).json({ error: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_HTTP_ERROR') {
			return res.status(502).json({
				error: err.message,
				code: err.code,
				status: err.status,
			})
		}
		console.error('aiAssistantController.leaveDraft:', err)
		res.status(500).json({ error: 'Leave draft request failed' })
	}
}

/**
 * POST body: { messages, locale } — draft work time entry from chat (preview; submit via POST /api/workdays).
 */
exports.workdayDraft = async (req, res) => {
	try {
		const { messages, locale } = req.body || {}
		await entitlementsService.assertAiMessageAllowedForUser(req.user.userId)
		const result = await runWorkdayDraftTurn({
			userId: req.user.userId,
			messages,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)
		res.json({
			reply: result.reply,
			draft: result.draft,
			draftError: result.draftError,
			draftMessage: result.draftMessage,
			model: result.model,
			usage: result.usage,
		})
	} catch (err) {
		if (err.code === 'AI_QUOTA_EXCEEDED' || err.code === 'AI_DISABLED_NO_SUBSCRIPTION') {
			return res.status(403).json({ error: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_NOT_CONFIGURED') {
			return res.status(503).json({
				error: err.message,
				code: err.code,
			})
		}
		if (err.code === 'VALIDATION' || err.code === 'USER_INVALID') {
			return res.status(400).json({ error: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_HTTP_ERROR') {
			return res.status(502).json({
				error: err.message,
				code: err.code,
				status: err.status,
			})
		}
		console.error('aiAssistantController.workdayDraft:', err)
		res.status(500).json({ error: 'Workday draft request failed' })
	}
}

exports.exportFromIntent = async (req, res) => {
	try {
		const format = req.body.format === 'pdf' ? 'pdf' : 'xlsx'
		const buf = await buildAiIntentExportBuffer({
			userId: req.user.userId,
			format,
			periodPreset: req.body.periodPreset,
			dateFrom: req.body.dateFrom,
			dateTo: req.body.dateTo,
			locale: req.body.locale,
			reportType: req.body.reportType,
			leaveStatuses: req.body.leaveStatuses,
			scopeTarget: req.body.scopeTarget,
			departmentHint: req.body.departmentHint,
		})
		const d = new Date().toISOString().slice(0, 10)
		if (format === 'pdf') {
			res.setHeader('Content-Type', 'application/pdf')
			res.setHeader('Content-Disposition', `attachment; filename="planopia-export-${d}.pdf"`)
		} else {
			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
			res.setHeader('Content-Disposition', `attachment; filename="planopia-export-${d}.xlsx"`)
		}
		res.send(buf)
	} catch (err) {
		if (err.code === 'USER_INVALID' || err.code === 'VALIDATION') {
			return res.status(400).json({ error: err.message, code: err.code })
		}
		console.error('aiAssistantController.exportFromIntent:', err)
		res.status(500).json({ error: 'Export failed' })
	}
}
