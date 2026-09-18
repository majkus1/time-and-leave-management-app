/**
 * Tryb „Jak działa Planopia”: odpowiedzi o działaniu aplikacji z bazy wiedzy produktowej,
 * bez DATA CONTEXT i bez zużywania limitu wiadomości AI. Do promptu trafia tylko stan planu zespołu i rola.
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('./entitlementsService')
const { createChatCompletion, createChatCompletionStream, isOpenAIConfigured } = require('./openaiService')
const { compileKnowledgeSections, computeKnowledgeVersion } = require('../utils/productKnowledgeRender')
const {
	normalizeHelpMessages,
	buildTeamPlanContext,
	buildHelpSystemPrompt,
	isKnownHelpModule,
	extractAppLinkMarkers,
	streamVisibleText,
} = require('../utils/aiHelpPrompt')

const HELP_MAX_OUTPUT_TOKENS = 900

/** Lista modułów do chipów w UI (bez treści — treść jest tylko w prompcie). */
function listHelpModules(locale) {
	const loc = locale === 'en' ? 'en' : 'pl'
	return {
		version: computeKnowledgeVersion(),
		modules: compileKnowledgeSections(loc).map(s => ({
			id: s.id,
			title: s.title,
			summary: s.summary,
			suggestedQuestions: s.suggestedQuestions,
			requires: s.requires,
		})),
	}
}

async function prepareHelpTurn(input) {
	if (!isOpenAIConfigured()) {
		const err = new Error('OpenAI is not configured')
		err.code = 'OPENAI_NOT_CONFIGURED'
		throw err
	}
	const messages = normalizeHelpMessages(input.messages)
	if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
		const err = new Error('No valid messages')
		err.code = 'VALIDATION'
		throw err
	}
	if (input.moduleId != null && input.moduleId !== '' && !isKnownHelpModule(input.moduleId)) {
		const err = new Error('Unknown help module')
		err.code = 'VALIDATION'
		throw err
	}

	const user = await User.findById(input.userId).select('roles teamId').lean()
	if (!user) {
		const err = new Error('User not found')
		err.code = 'USER_INVALID'
		throw err
	}
	// Zespół pytającego — bez jego danych, tylko stan planu (żelazna reguła 1: zawsze własny teamId).
	const team = await Team.findById(user.teamId)
	const entitlements = team ? entitlementsService.buildClientEntitlements(team) : null
	const locale = input.locale === 'en' ? 'en' : 'pl'

	const prompt = buildHelpSystemPrompt({
		locale,
		moduleId: input.moduleId || null,
		roles: user.roles,
		teamPlanContext: buildTeamPlanContext({ locale, roles: user.roles, entitlements }),
	})

	return {
		openaiMessages: [{ role: 'system', content: prompt.system }, ...messages],
		promptCacheKey: prompt.promptCacheKey,
		locale,
		roles: user.roles,
		meta: { mode: 'help', module: prompt.moduleId, knowledgeVersion: prompt.knowledgeVersion },
	}
}

exports.listHelpModules = listHelpModules

exports.runHelpTurn = async function runHelpTurn(input) {
	const { openaiMessages, promptCacheKey, meta, locale, roles } = await prepareHelpTurn(input)
	const { content, model, usage } = await createChatCompletion({
		messages: openaiMessages,
		path: 'help',
		temperature: 0.3,
		maxTokens: HELP_MAX_OUTPUT_TOKENS,
		verbosity: 'low',
		promptCacheKey,
	})
	const { text, links } = extractAppLinkMarkers(content, { locale, roles })
	return { reply: text, links, model, usage, meta }
}

/**
 * Async generator: { type:'meta', meta } → { type:'delta', text }* → { type:'links', links }? → { type:'end', model, usage }.
 * Znaczniki [[LINK:id]] nie trafiają do użytkownika: tekst za ostatnim otwartym „[[” jest wstrzymywany do końca.
 */
exports.iterateHelpTurnStream = async function* iterateHelpTurnStream(input) {
	const { openaiMessages, promptCacheKey, meta, locale, roles } = await prepareHelpTurn(input)
	yield { type: 'meta', meta }
	let full = ''
	let sent = 0
	for await (const ev of createChatCompletionStream({
		messages: openaiMessages,
		path: 'help',
		temperature: 0.3,
		maxTokens: HELP_MAX_OUTPUT_TOKENS,
		verbosity: 'low',
		promptCacheKey,
	})) {
		if (ev.type === 'delta') {
			full += ev.text
			const visible = streamVisibleText(full)
			if (visible.length > sent) {
				yield { type: 'delta', text: visible.slice(sent) }
				sent = visible.length
			}
		} else if (ev.type === 'done') {
			const { text, links } = extractAppLinkMarkers(full, { locale, roles })
			// Końcowy tekst różni się od wysłanego co najwyżej białymi znakami na końcu (trimEnd) — dosyłamy tylko nadwyżkę.
			if (text.length > sent) yield { type: 'delta', text: text.slice(sent) }
			if (links.length) yield { type: 'links', links }
			yield { type: 'end', model: ev.model, usage: ev.usage || null }
		}
	}
}

exports.isOpenAIConfigured = isOpenAIConfigured
