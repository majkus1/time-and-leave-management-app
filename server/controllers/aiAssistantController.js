const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { runAssistantTurn, iterateAssistantTurnStream, isOpenAIConfigured } = require('../services/aiAssistantService')
const { buildAiIntentExportBuffer } = require('../services/aiExportFileService')
const { runLeaveDraftTurn } = require('../services/aiLeaveDraftService')
const { runWorkdayDraftTurn } = require('../services/aiWorkdayDraftService')
const entitlementsService = require('../services/entitlementsService')
const { createLog } = require('../services/logService')
const { respondAiAssistantError, aiAssistantSseErrorPayload } = require('../utils/clientSafeErrors')
const { recordAiUsage } = require('../services/aiUsageLogService')

const logAiUse = (req, action, details) => {
	const who = req.user?.username || '—'
	createLog(req.user.userId, action, `${details} · ${who}`, req.user.userId)
}

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
		const startedAt = Date.now()
		const result = await runAssistantTurn({
			userId: req.user.userId,
			messages,
			periodPreset,
			dateFrom,
			dateTo,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)
		logAiUse(req, 'AI_ASSISTANT_CHAT', 'Asystent AI — rozmowa (czat)')
		recordAiUsage({ teamId: req.user.teamId, userId: req.user.userId, path: 'data_chat', mode: 'chat', model: result.model, usage: result.usage, durationMs: Date.now() - startedAt })

		res.json({
			reply: result.reply,
			model: result.model,
			meta: result.meta,
			usage: result.usage,
		})
	} catch (err) {
		const handled = respondAiAssistantError(err, res)
		if (handled) return handled
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
		const startedAt = Date.now()
		let streamEnd = null
		for await (const ev of iterateAssistantTurnStream({
			userId: req.user.userId,
			messages,
			periodPreset,
			dateFrom,
			dateTo,
			locale,
		})) {
			if (ev.type === 'end') streamEnd = ev
			writeSse(ev)
		}
		try {
			await entitlementsService.consumeAiMessageForUser(req.user.userId)
			logAiUse(req, 'AI_ASSISTANT_CHAT', 'Asystent AI — rozmowa (czat, strumień)')
			if (streamEnd) {
				recordAiUsage({ teamId: req.user.teamId, userId: req.user.userId, path: 'data_chat', mode: 'chat', model: streamEnd.model, usage: streamEnd.usage, durationMs: Date.now() - startedAt })
			}
		} catch (consumeErr) {
			writeSse(
				aiAssistantSseErrorPayload({
					...consumeErr,
					code: consumeErr.code || 'AI_CONSUME_FAILED',
				})
			)
		}
		res.end()
	} catch (err) {
		if (!res.headersSent) {
			const handled = respondAiAssistantError(err, res)
			if (handled) return handled
			console.error('aiAssistantController.chatStream:', err)
			return res.status(500).json({ error: 'AI assistant request failed' })
		}

		try {
			writeSse(aiAssistantSseErrorPayload(err))
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
		const startedAt = Date.now()
		const result = await runLeaveDraftTurn({
			userId: req.user.userId,
			messages,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)
		logAiUse(req, 'AI_ASSISTANT_LEAVE_DRAFT', 'Asystent AI — szkic wniosku urlopowego')
		recordAiUsage({ teamId: req.user.teamId, userId: req.user.userId, path: 'json_draft', mode: 'leave', model: result.model, usage: result.usage, durationMs: Date.now() - startedAt })
		res.json({
			reply: result.reply,
			draft: result.draft,
			draftError: result.draftError,
			model: result.model,
			usage: result.usage,
		})
	} catch (err) {
		const handled = respondAiAssistantError(err, res)
		if (handled) return handled
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
		const startedAt = Date.now()
		const result = await runWorkdayDraftTurn({
			userId: req.user.userId,
			messages,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)
		logAiUse(req, 'AI_ASSISTANT_WORKDAY_DRAFT', 'Asystent AI — szkic wpisu ewidencji czasu')
		recordAiUsage({ teamId: req.user.teamId, userId: req.user.userId, path: 'json_draft', mode: 'workday', model: result.model, usage: result.usage, durationMs: Date.now() - startedAt })
		res.json({
			reply: result.reply,
			draft: result.draft,
			draftError: result.draftError,
			draftMessage: result.draftMessage,
			model: result.model,
			usage: result.usage,
		})
	} catch (err) {
		const handled = respondAiAssistantError(err, res)
		if (handled) return handled
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
		const locale = String(req.body.locale || 'pl').toLowerCase()
		const reportType = String(req.body.reportType || '').toLowerCase()
		const isPl = locale.startsWith('pl')
		const reportName = (() => {
			if (reportType.includes('leave')) return isPl ? 'raport-urlopy' : 'leave-report'
			if (reportType.includes('task')) return isPl ? 'raport-zadania' : 'tasks-report'
			if (reportType.includes('team')) return isPl ? 'raport-zespolu' : 'team-report'
			if (reportType.includes('work') || reportType.includes('time')) return isPl ? 'raport-ewidencja-czasu-pracy' : 'timesheet-report'
			return isPl ? 'raport-planopia' : 'planopia-report'
		})()
		if (format === 'pdf') {
			res.setHeader('Content-Type', 'application/pdf')
			res.setHeader('Content-Disposition', `attachment; filename="${reportName}-${d}.pdf"`)
		} else {
			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
			res.setHeader('Content-Disposition', `attachment; filename="${reportName}-${d}.xlsx"`)
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
