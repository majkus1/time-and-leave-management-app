/**
 * Cienki wrapper na OpenAI Chat Completions (bez zależności npm).
 * Ciało żądania buduje utils/openaiRequestBody — tam siedzi wiedza o różnicach między rodzinami modeli.
 */
const {
	DEFAULT_MODEL,
	buildChatCompletionBody,
	resolveModelForPath,
	resolveReasoningEffortForPath,
} = require('../utils/openaiRequestBody')

const API_URL = 'https://api.openai.com/v1/chat/completions'
/** Czat z danymi zespołu potrafi trwać długo; poniżej tej granicy nie przerywamy. */
const REQUEST_TIMEOUT_MS = 90_000

function throwOpenAINotConfigured() {
	console.error('[openai] OPENAI_API_KEY is not configured')
	const err = new Error('OpenAI is not configured')
	err.code = 'OPENAI_NOT_CONFIGURED'
	throw err
}

function apiKeyOrThrow() {
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey || !apiKey.trim()) throwOpenAINotConfigured()
	return apiKey.trim()
}

/**
 * Model i wysiłek rozumowania dla ścieżki użycia; jawny `model` ma pierwszeństwo.
 * @param {string|undefined} path
 * @param {string|undefined} model
 */
function resolveRequestDefaults(path, model, reasoningEffort) {
	return {
		model: (model || resolveModelForPath(path)).trim(),
		reasoningEffort: reasoningEffort || (path ? resolveReasoningEffortForPath(path) : undefined),
	}
}

async function postCompletion(body) {
	const res = await fetch(API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKeyOrThrow()}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	return res
}

async function throwHttpError(res, model) {
	const data = await res.json().catch(() => ({}))
	const msg = data?.error?.message || res.statusText || 'OpenAI request failed'
	// Najczęstszy błąd po zmianie modelu w .env — parametr, którego nowa rodzina nie zna.
	if (res.status === 400 && /unsupported|not supported|unknown parameter/i.test(msg)) {
		console.error(`[openai] model ${model} odrzucił parametr żądania: ${msg}`)
	}
	const err = new Error(msg)
	err.code = 'OPENAI_HTTP_ERROR'
	err.status = res.status
	err.details = data
	throw err
}

function contentOrThrow(data) {
	const content = data.choices?.[0]?.message?.content
	if (typeof content !== 'string') {
		const err = new Error('Empty or invalid response from OpenAI')
		err.code = 'OPENAI_EMPTY'
		throw err
	}
	return content.trim()
}

/**
 * @param {object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string} [opts.path] data_chat | help | json_draft | schedule_draft | export_intent
 * @param {string} [opts.model]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {string} [opts.reasoningEffort]
 * @param {string} [opts.verbosity]
 * @param {string} [opts.promptCacheKey]
 */
exports.createChatCompletion = async function createChatCompletion({
	messages,
	path,
	model,
	temperature = 0.35,
	maxTokens = 4096,
	reasoningEffort,
	verbosity,
	promptCacheKey,
}) {
	const defaults = resolveRequestDefaults(path, model, reasoningEffort)
	const body = buildChatCompletionBody({
		model: defaults.model,
		messages,
		temperature,
		maxOutputTokens: maxTokens,
		reasoningEffort: defaults.reasoningEffort,
		verbosity,
		promptCacheKey,
	})
	const res = await postCompletion(body)
	if (!res.ok) await throwHttpError(res, defaults.model)
	const data = await res.json().catch(() => ({}))
	return {
		content: contentOrThrow(data),
		model: data.model || defaults.model,
		usage: data.usage || null,
	}
}

/**
 * Chat completion z odpowiedzią JSON (drafty, klasyfikator eksportu).
 */
exports.createChatCompletionJson = async function createChatCompletionJson({
	messages,
	path,
	model,
	maxTokens = 500,
	temperature = 0.1,
	reasoningEffort,
	promptCacheKey,
}) {
	const defaults = resolveRequestDefaults(path, model, reasoningEffort)
	const body = buildChatCompletionBody({
		model: defaults.model,
		messages,
		temperature,
		maxOutputTokens: maxTokens,
		reasoningEffort: defaults.reasoningEffort,
		responseFormat: { type: 'json_object' },
		promptCacheKey,
	})
	const res = await postCompletion(body)
	if (!res.ok) await throwHttpError(res, defaults.model)
	const data = await res.json().catch(() => ({}))
	return {
		content: contentOrThrow(data),
		model: data.model || defaults.model,
		usage: data.usage || null,
	}
}

function parseSseChunk(payload) {
	if (!payload || payload === '[DONE]') return null
	try {
		return JSON.parse(payload)
	} catch {
		return null
	}
}

/**
 * Strumień (OpenAI SSE). Yielduje { type: 'delta', text } … i na końcu { type: 'done', model, usage }.
 * Przy `stream_options.include_usage` ostatni chunk niesie `usage` i pustą listę `choices`.
 */
exports.createChatCompletionStream = async function* createChatCompletionStream({
	messages,
	path,
	model,
	temperature = 0.35,
	maxTokens = 4096,
	reasoningEffort,
	verbosity,
	promptCacheKey,
}) {
	const defaults = resolveRequestDefaults(path, model, reasoningEffort)
	const body = buildChatCompletionBody({
		model: defaults.model,
		messages,
		temperature,
		maxOutputTokens: maxTokens,
		reasoningEffort: defaults.reasoningEffort,
		verbosity,
		promptCacheKey,
		stream: true,
	})
	const res = await postCompletion(body)

	if (!res.ok) {
		let msg = res.statusText || 'OpenAI request failed'
		try {
			const data = await res.json()
			msg = data?.error?.message || msg
		} catch {
			try {
				msg = (await res.text()) || msg
			} catch {
				// ignore
			}
		}
		if (res.status === 400 && /unsupported|not supported|unknown parameter/i.test(msg)) {
			console.error(`[openai] model ${defaults.model} odrzucił parametr żądania: ${msg}`)
		}
		const err = new Error(msg)
		err.code = 'OPENAI_HTTP_ERROR'
		err.status = res.status
		throw err
	}

	if (!res.body) {
		const err = new Error('Empty response body from OpenAI')
		err.code = 'OPENAI_EMPTY'
		throw err
	}

	const reader = res.body.getReader()
	const decoder = new TextDecoder()
	let buffer = ''
	let lastModel = defaults.model
	let lastUsage = null

	const handleJson = json => {
		if (json.error) {
			const err = new Error(json.error.message || 'OpenAI stream error')
			err.code = 'OPENAI_STREAM_ERROR'
			throw err
		}
		if (typeof json.model === 'string' && json.model) lastModel = json.model
		if (json.usage) lastUsage = json.usage
		const delta = json.choices?.[0]?.delta?.content
		return typeof delta === 'string' && delta.length > 0 ? delta : null
	}

	const dataLineOf = rawEvent =>
		rawEvent
			.split('\n')
			.map(l => l.replace(/\r$/, ''))
			.find(l => l.startsWith('data: '))

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, { stream: true })

		let sep
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const rawEvent = buffer.slice(0, sep)
			buffer = buffer.slice(sep + 2)
			const dataLine = dataLineOf(rawEvent)
			if (!dataLine) continue
			const json = parseSseChunk(dataLine.slice(6).trim())
			if (!json) continue
			const delta = handleJson(json)
			if (delta) yield { type: 'delta', text: delta }
		}
	}

	// Ostatni chunk może nie mieć końcowego \n\n
	if (buffer.trim()) {
		const dataLine = dataLineOf(buffer)
		if (dataLine) {
			const json = parseSseChunk(dataLine.slice(6).trim())
			if (json) {
				const delta = handleJson(json)
				if (delta) yield { type: 'delta', text: delta }
			}
		}
	}

	yield { type: 'done', model: lastModel, usage: lastUsage }
}

exports.isOpenAIConfigured = function isOpenAIConfigured() {
	return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
}

exports.DEFAULT_MODEL = DEFAULT_MODEL
