/**
 * Bliźniak server/utils/openaiRequestBody.js + server/constants/openaiPricing.js dla landingu
 * (osobny pakiet, budowany na Vercelu bez dostępu do server/). Zmiana tam = ta sama zmiana tutaj.
 *
 * gpt-5* / o* odrzucają `temperature` ≠ 1 i `max_tokens`, przyjmują `reasoning_effort`;
 * gpt-4o* / gpt-4.1* odwrotnie — model w env nie może wymagać zmian w kodzie.
 */

export const LANDING_DEFAULT_MODEL = 'gpt-4o-mini'
const REASONING_HEADROOM_TOKENS = 1024

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ModelCapabilities = {
	isReasoning: boolean
	supportsTemperature: boolean
	supportsReasoningEffort: boolean
	supportsMinimalEffort: boolean
	supportsVerbosity: boolean
}

export function modelCapabilities(model: string): ModelCapabilities {
	const m = String(model || '').toLowerCase()
	const isGpt5 = /^gpt-5/.test(m)
	const isOSeries = /^o[1-9]/.test(m)
	const isReasoning = isGpt5 || isOSeries
	return {
		isReasoning,
		supportsTemperature: !isReasoning,
		supportsReasoningEffort: isReasoning,
		supportsMinimalEffort: isGpt5,
		supportsVerbosity: isGpt5,
	}
}

export function resolveLandingModel(env: NodeJS.ProcessEnv = process.env): string {
	return String(env.OPENAI_MODEL_LANDING || env.OPENAI_MODEL || LANDING_DEFAULT_MODEL).trim()
}

export function resolveLandingReasoningEffort(env: NodeJS.ProcessEnv = process.env): string {
	return String(env.OPENAI_REASONING_EFFORT_LANDING || 'minimal').trim()
}

export type ChatCompletionBodyOptions = {
	model: string
	messages: ChatMessage[]
	temperature?: number
	maxOutputTokens?: number
	reasoningEffort?: string
	verbosity?: string
	stream?: boolean
	promptCacheKey?: string
}

export function buildChatCompletionBody({
	model,
	messages,
	temperature,
	maxOutputTokens,
	reasoningEffort,
	verbosity,
	stream = false,
	promptCacheKey,
}: ChatCompletionBodyOptions): Record<string, unknown> {
	if (!model) throw new Error('buildChatCompletionBody: model is required')
	if (!Array.isArray(messages) || messages.length === 0) {
		throw new Error('buildChatCompletionBody: messages must be a non-empty array')
	}
	const caps = modelCapabilities(model)
	const body: Record<string, unknown> = { model, messages }

	if (caps.supportsTemperature && typeof temperature === 'number') body.temperature = temperature
	if (typeof maxOutputTokens === 'number' && maxOutputTokens > 0) {
		body.max_completion_tokens = caps.isReasoning ? maxOutputTokens + REASONING_HEADROOM_TOKENS : maxOutputTokens
	}
	if (caps.supportsReasoningEffort && reasoningEffort) {
		body.reasoning_effort = reasoningEffort === 'minimal' && !caps.supportsMinimalEffort ? 'low' : reasoningEffort
	}
	if (caps.supportsVerbosity && verbosity) body.verbosity = verbosity
	if (stream) {
		body.stream = true
		body.stream_options = { include_usage: true }
	}
	if (promptCacheKey) body.prompt_cache_key = String(promptCacheKey).slice(0, 64)
	return body
}

/* --- szacunek kosztu (USD / 1M tokenów; publiczny cennik, orientacyjnie) --- */

const PRICING_USD_PER_1M: Record<string, { in: number; cachedIn: number; out: number }> = {
	'gpt-4o-mini': { in: 0.15, cachedIn: 0.075, out: 0.6 },
	'gpt-4o': { in: 2.5, cachedIn: 1.25, out: 10 },
	'gpt-4.1-mini': { in: 0.4, cachedIn: 0.1, out: 1.6 },
	'gpt-4.1-nano': { in: 0.1, cachedIn: 0.025, out: 0.4 },
	'gpt-4.1': { in: 2, cachedIn: 0.5, out: 8 },
	'gpt-5-mini': { in: 0.25, cachedIn: 0.025, out: 2 },
	'gpt-5-nano': { in: 0.05, cachedIn: 0.005, out: 0.4 },
	'gpt-5': { in: 1.25, cachedIn: 0.125, out: 10 },
}

export type OpenAiUsage = {
	prompt_tokens?: number
	completion_tokens?: number
	prompt_tokens_details?: { cached_tokens?: number }
	completion_tokens_details?: { reasoning_tokens?: number }
}

export function normalizeUsage(usage: OpenAiUsage | null | undefined) {
	const u = usage || {}
	return {
		promptTokens: Number(u.prompt_tokens) || 0,
		cachedTokens: Number(u.prompt_tokens_details?.cached_tokens) || 0,
		completionTokens: Number(u.completion_tokens) || 0,
		reasoningTokens: Number(u.completion_tokens_details?.reasoning_tokens) || 0,
	}
}

export function estimateCostUsd(model: string, usage: OpenAiUsage | null | undefined): number | null {
	const m = String(model || '').toLowerCase()
	let best: string | null = null
	for (const key of Object.keys(PRICING_USD_PER_1M)) {
		if (m.startsWith(key) && (!best || key.length > best.length)) best = key
	}
	if (!best) return null
	const price = PRICING_USD_PER_1M[best]
	const { promptTokens, cachedTokens, completionTokens } = normalizeUsage(usage)
	const uncached = Math.max(0, promptTokens - cachedTokens)
	const cost = (uncached * price.in + cachedTokens * price.cachedIn + completionTokens * price.out) / 1_000_000
	return Math.round(cost * 1e6) / 1e6
}
