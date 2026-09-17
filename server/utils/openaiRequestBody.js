/**
 * Budowa ciała żądania do OpenAI Chat Completions niezależnie od rodziny modelu.
 *
 * Rodziny różnią się parametrami: gpt-5* i o* (modele „rozumujące”) odrzucają `temperature`
 * inne niż domyślne i `max_tokens`, za to przyjmują `reasoning_effort`; starsze (gpt-4o*, gpt-4.1*)
 * odwrotnie. Zmiana modelu w .env nie może wymagać zmian w kodzie — stąd ten moduł.
 * Czysta logika, bez bazy — testowana w server/tests/openaiRequestBody.test.js.
 */

const DEFAULT_MODEL = 'gpt-4o-mini'

/** Ścieżki użycia → zmienna środowiskowa z modelem. Brak zmiennej = OPENAI_MODEL = DEFAULT_MODEL. */
const PATH_MODEL_ENV = {
	data_chat: 'OPENAI_MODEL_DATA_CHAT',
	help: 'OPENAI_MODEL_HELP',
	json_draft: 'OPENAI_MODEL_JSON',
	schedule_draft: 'OPENAI_MODEL_JSON',
	export_intent: 'OPENAI_MODEL_JSON',
}

/** Domyślny wysiłek rozumowania per ścieżka (dotyczy tylko modeli rozumujących). */
const PATH_DEFAULT_REASONING = {
	data_chat: 'low',
	help: 'minimal',
	json_draft: 'minimal',
	schedule_draft: 'medium',
	export_intent: 'minimal',
}

/** Zapas na tokeny rozumowania — wliczają się do max_completion_tokens i obcinałyby odpowiedź. */
const REASONING_HEADROOM_TOKENS = 1024

function modelCapabilities(model) {
	const m = String(model || '').toLowerCase()
	const isGpt5 = /^gpt-5/.test(m)
	const isOSeries = /^o[1-9]/.test(m)
	const isReasoning = isGpt5 || isOSeries
	return {
		isReasoning,
		supportsTemperature: !isReasoning,
		supportsReasoningEffort: isReasoning,
		// `minimal` istnieje tylko w gpt-5; o-series zna low/medium/high.
		supportsMinimalEffort: isGpt5,
		supportsVerbosity: isGpt5,
	}
}

function resolveModelForPath(path, env = process.env) {
	const perPath = PATH_MODEL_ENV[path] ? env[PATH_MODEL_ENV[path]] : null
	return String(perPath || env.OPENAI_MODEL || DEFAULT_MODEL).trim()
}

function resolveReasoningEffortForPath(path, env = process.env) {
	const key = `OPENAI_REASONING_EFFORT_${String(path || '').toUpperCase()}`
	return String(env[key] || PATH_DEFAULT_REASONING[path] || 'low').trim()
}

/**
 * @param {object} opts
 * @param {string} opts.model
 * @param {Array<{role:string, content:string}>} opts.messages
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxOutputTokens]
 * @param {string} [opts.reasoningEffort] minimal | low | medium | high
 * @param {string} [opts.verbosity] low | medium | high (tylko gpt-5)
 * @param {object} [opts.responseFormat] np. { type: 'json_object' }
 * @param {boolean} [opts.stream]
 * @param {string} [opts.promptCacheKey] stały klucz dla żądań o wspólnym prefiksie promptu
 */
function buildChatCompletionBody({
	model,
	messages,
	temperature,
	maxOutputTokens,
	reasoningEffort,
	verbosity,
	responseFormat,
	stream = false,
	promptCacheKey,
}) {
	if (!model) throw new Error('buildChatCompletionBody: model is required')
	if (!Array.isArray(messages) || messages.length === 0) {
		throw new Error('buildChatCompletionBody: messages must be a non-empty array')
	}
	const caps = modelCapabilities(model)
	const body = { model, messages }

	if (caps.supportsTemperature && typeof temperature === 'number') {
		body.temperature = temperature
	}
	if (typeof maxOutputTokens === 'number' && maxOutputTokens > 0) {
		body.max_completion_tokens = caps.isReasoning
			? maxOutputTokens + REASONING_HEADROOM_TOKENS
			: maxOutputTokens
	}
	if (caps.supportsReasoningEffort && reasoningEffort) {
		body.reasoning_effort =
			reasoningEffort === 'minimal' && !caps.supportsMinimalEffort ? 'low' : reasoningEffort
	}
	if (caps.supportsVerbosity && verbosity) {
		body.verbosity = verbosity
	}
	if (responseFormat) {
		body.response_format = responseFormat
	}
	if (stream) {
		body.stream = true
		body.stream_options = { include_usage: true }
	}
	if (promptCacheKey) {
		body.prompt_cache_key = String(promptCacheKey).slice(0, 64)
	}
	return body
}

module.exports = {
	DEFAULT_MODEL,
	PATH_MODEL_ENV,
	REASONING_HEADROOM_TOKENS,
	modelCapabilities,
	resolveModelForPath,
	resolveReasoningEffortForPath,
	buildChatCompletionBody,
}
