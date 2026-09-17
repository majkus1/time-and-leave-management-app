/**
 * Orientacyjny cennik OpenAI (USD za 1 mln tokenów) do szacowania kosztu w AiUsageLog.
 * Wartości z publicznego cennika; przy zmianie cen aktualizuj tutaj — szacunek, nie faktura.
 * Klucz dopasowywany po najdłuższym prefiksie, więc datowane snapshoty (gpt-4o-mini-2024-07-18) też trafiają.
 */
const PRICING_USD_PER_1M = {
	'gpt-4o-mini': { in: 0.15, cachedIn: 0.075, out: 0.6 },
	'gpt-4o': { in: 2.5, cachedIn: 1.25, out: 10 },
	'gpt-4.1-mini': { in: 0.4, cachedIn: 0.1, out: 1.6 },
	'gpt-4.1-nano': { in: 0.1, cachedIn: 0.025, out: 0.4 },
	'gpt-4.1': { in: 2, cachedIn: 0.5, out: 8 },
	'gpt-5-mini': { in: 0.25, cachedIn: 0.025, out: 2 },
	'gpt-5-nano': { in: 0.05, cachedIn: 0.005, out: 0.4 },
	'gpt-5': { in: 1.25, cachedIn: 0.125, out: 10 },
}

function priceFor(model) {
	const m = String(model || '').toLowerCase()
	let best = null
	for (const key of Object.keys(PRICING_USD_PER_1M)) {
		if (m.startsWith(key) && (!best || key.length > best.length)) best = key
	}
	return best ? PRICING_USD_PER_1M[best] : null
}

/**
 * Rozkłada `usage` z odpowiedzi OpenAI na liczby, których używamy w logu.
 * Tokeny rozumowania są już wliczone w completion_tokens — nie doliczamy ich drugi raz.
 */
function normalizeUsage(usage) {
	const u = usage || {}
	const promptTokens = Number(u.prompt_tokens) || 0
	const cachedTokens = Number(u.prompt_tokens_details?.cached_tokens) || 0
	const completionTokens = Number(u.completion_tokens) || 0
	const reasoningTokens = Number(u.completion_tokens_details?.reasoning_tokens) || 0
	return { promptTokens, cachedTokens, completionTokens, reasoningTokens }
}

/** @returns {number|null} koszt w USD albo null, gdy model nieznany */
function estimateCostUsd(model, usage) {
	const price = priceFor(model)
	if (!price) return null
	const { promptTokens, cachedTokens, completionTokens } = normalizeUsage(usage)
	const uncached = Math.max(0, promptTokens - cachedTokens)
	const cost = (uncached * price.in + cachedTokens * price.cachedIn + completionTokens * price.out) / 1_000_000
	return Math.round(cost * 1e6) / 1e6
}

module.exports = { PRICING_USD_PER_1M, priceFor, normalizeUsage, estimateCostUsd }
