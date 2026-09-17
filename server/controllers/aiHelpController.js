const { listHelpModules, runHelpTurn, iterateHelpTurnStream } = require('../services/aiHelpAssistantService')
const { createLog } = require('../services/logService')
const { respondAiAssistantError, aiAssistantSseErrorPayload } = require('../utils/clientSafeErrors')
const { recordAiUsage } = require('../services/aiUsageLogService')

const logHelpUse = (req, details) => {
	const who = req.user?.username || '—'
	createLog(req.user.userId, 'AI_HELP_CHAT', `${details} · ${who}`, req.user.userId)
}

/** GET /api/ai-help/modules?locale=pl|en */
exports.getModules = (req, res) => {
	const locale = req.query?.locale === 'en' ? 'en' : 'pl'
	res.setHeader('Cache-Control', 'private, max-age=3600')
	res.json(listHelpModules(locale))
}

/** POST /api/ai-help/chat — body: { messages, locale?, module? } (bez limitu wiadomości AI) */
exports.chat = async (req, res) => {
	try {
		const { messages, locale, module: moduleId } = req.body || {}
		const startedAt = Date.now()
		const result = await runHelpTurn({ userId: req.user.userId, messages, locale, moduleId })
		logHelpUse(req, 'Asystent AI — jak działa Planopia')
		recordAiUsage({
			teamId: req.user.teamId,
			userId: req.user.userId,
			path: 'help',
			mode: 'help',
			helpModule: result.meta.module,
			model: result.model,
			usage: result.usage,
			durationMs: Date.now() - startedAt,
			knowledgeVersion: result.meta.knowledgeVersion,
		})
		res.json({ reply: result.reply, model: result.model, meta: result.meta, usage: result.usage })
	} catch (err) {
		const handled = respondAiAssistantError(err, res)
		if (handled) return handled
		console.error('aiHelpController.chat:', err)
		res.status(500).json({ error: 'AI help request failed' })
	}
}

/**
 * POST /api/ai-help/chat/stream — SSE, eventy jak w /api/ai-assistant/chat/stream:
 * { type:'meta', meta }, { type:'delta', text }, { type:'end', model }, { type:'error', code?, message } — bez exportOffer.
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
		if (typeof res.flushHeaders === 'function') res.flushHeaders()

		const { messages, locale, module: moduleId } = req.body || {}
		const startedAt = Date.now()
		let meta = null
		let streamEnd = null
		for await (const ev of iterateHelpTurnStream({ userId: req.user.userId, messages, locale, moduleId })) {
			if (ev.type === 'meta') meta = ev.meta
			if (ev.type === 'end') streamEnd = ev
			writeSse(ev)
		}
		logHelpUse(req, 'Asystent AI — jak działa Planopia (strumień)')
		if (streamEnd) {
			recordAiUsage({
				teamId: req.user.teamId,
				userId: req.user.userId,
				path: 'help',
				mode: 'help',
				helpModule: meta?.module || null,
				model: streamEnd.model,
				usage: streamEnd.usage,
				durationMs: Date.now() - startedAt,
				knowledgeVersion: meta?.knowledgeVersion || null,
			})
		}
		res.end()
	} catch (err) {
		if (!res.headersSent) {
			const handled = respondAiAssistantError(err, res)
			if (handled) return handled
			console.error('aiHelpController.chatStream:', err)
			return res.status(500).json({ error: 'AI help request failed' })
		}
		try {
			writeSse(aiAssistantSseErrorPayload(err))
		} catch (writeErr) {
			console.error('aiHelpController.chatStream write error:', writeErr)
		}
		res.end()
	}
}
