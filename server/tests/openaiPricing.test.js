const test = require('node:test')
const assert = require('node:assert/strict')

const { priceFor, normalizeUsage, estimateCostUsd } = require('../constants/openaiPricing')

test('cena po najdluzszym prefiksie — gpt-5-mini nie dostaje ceny gpt-5, snapshot dostaje cene bazowa', () => {
	assert.equal(priceFor('gpt-5-mini').in, 0.25)
	assert.equal(priceFor('gpt-5').in, 1.25)
	assert.equal(priceFor('gpt-4o-mini-2024-07-18').in, 0.15)
	assert.equal(priceFor('nieznany-model'), null)
})

test('normalizeUsage czyta cached i reasoning z details, brakujace = 0', () => {
	const u = normalizeUsage({
		prompt_tokens: 1000,
		completion_tokens: 200,
		prompt_tokens_details: { cached_tokens: 800 },
		completion_tokens_details: { reasoning_tokens: 50 },
	})
	assert.deepEqual(u, { promptTokens: 1000, cachedTokens: 800, completionTokens: 200, reasoningTokens: 50 })
	assert.deepEqual(normalizeUsage(null), { promptTokens: 0, cachedTokens: 0, completionTokens: 0, reasoningTokens: 0 })
})

test('koszt: cache liczony po stawce cached, reszta po pelnej, wyjscie osobno', () => {
	const usage = { prompt_tokens: 10_000, completion_tokens: 1_000, prompt_tokens_details: { cached_tokens: 8_000 } }
	// gpt-4o-mini: 2000*0.15 + 8000*0.075 + 1000*0.6 = 300 + 600 + 600 = 1500 / 1e6
	assert.equal(estimateCostUsd('gpt-4o-mini', usage), 0.0015)
	assert.equal(estimateCostUsd('model-bez-cennika', usage), null)
})
