const test = require('node:test')
const assert = require('node:assert/strict')

const {
	buildChatCompletionBody,
	modelCapabilities,
	resolveModelForPath,
	resolveReasoningEffortForPath,
	REASONING_HEADROOM_TOKENS,
	DEFAULT_MODEL,
} = require('../utils/openaiRequestBody')

const messages = [{ role: 'user', content: 'hej' }]

test('gpt-4o-mini: temperature i max_completion_tokens, bez reasoning', () => {
	const body = buildChatCompletionBody({ model: 'gpt-4o-mini', messages, temperature: 0.35, maxOutputTokens: 900 })
	assert.equal(body.temperature, 0.35)
	assert.equal(body.max_completion_tokens, 900)
	assert.equal('max_tokens' in body, false)
	assert.equal('reasoning_effort' in body, false)
	assert.equal('verbosity' in body, false)
})

test('gpt-5-mini: bez temperature, z reasoning_effort i zapasem na tokeny rozumowania', () => {
	const body = buildChatCompletionBody({
		model: 'gpt-5-mini',
		messages,
		temperature: 0.35,
		maxOutputTokens: 900,
		reasoningEffort: 'minimal',
		verbosity: 'low',
	})
	assert.equal('temperature' in body, false)
	assert.equal(body.reasoning_effort, 'minimal')
	assert.equal(body.verbosity, 'low')
	assert.equal(body.max_completion_tokens, 900 + REASONING_HEADROOM_TOKENS)
})

test('o-series: minimal nie istnieje — spada do low; brak verbosity', () => {
	const body = buildChatCompletionBody({ model: 'o4-mini', messages, reasoningEffort: 'minimal', verbosity: 'low', maxOutputTokens: 100 })
	assert.equal(body.reasoning_effort, 'low')
	assert.equal('verbosity' in body, false)
})

test('stream dodaje stream_options.include_usage; json dodaje response_format; cache key obcinany', () => {
	const body = buildChatCompletionBody({
		model: 'gpt-4.1-mini',
		messages,
		stream: true,
		responseFormat: { type: 'json_object' },
		promptCacheKey: 'x'.repeat(100),
	})
	assert.equal(body.stream, true)
	assert.deepEqual(body.stream_options, { include_usage: true })
	assert.deepEqual(body.response_format, { type: 'json_object' })
	assert.equal(body.prompt_cache_key.length, 64)
})

test('modelCapabilities rozpoznaje rodziny po prefiksie (takze datowane snapshoty)', () => {
	assert.equal(modelCapabilities('gpt-4o-mini-2024-07-18').supportsTemperature, true)
	assert.equal(modelCapabilities('gpt-5-mini-2025-08-07').isReasoning, true)
	assert.equal(modelCapabilities('gpt-4.1-nano').isReasoning, false)
	assert.equal(modelCapabilities('o3').supportsMinimalEffort, false)
})

test('model per sciezka z env, fallback do OPENAI_MODEL i domyslnego', () => {
	assert.equal(resolveModelForPath('help', {}), DEFAULT_MODEL)
	assert.equal(resolveModelForPath('help', { OPENAI_MODEL: 'gpt-4.1-mini' }), 'gpt-4.1-mini')
	assert.equal(resolveModelForPath('help', { OPENAI_MODEL: 'gpt-4.1-mini', OPENAI_MODEL_HELP: 'gpt-5-mini ' }), 'gpt-5-mini')
	assert.equal(resolveModelForPath('export_intent', { OPENAI_MODEL_JSON: 'gpt-4.1-nano' }), 'gpt-4.1-nano')
	assert.equal(resolveModelForPath(undefined, { OPENAI_MODEL: 'gpt-4o-mini' }), 'gpt-4o-mini')
})

test('wysilek rozumowania per sciezka: env nadpisuje domyslne', () => {
	assert.equal(resolveReasoningEffortForPath('help', {}), 'minimal')
	assert.equal(resolveReasoningEffortForPath('data_chat', {}), 'low')
	assert.equal(resolveReasoningEffortForPath('data_chat', { OPENAI_REASONING_EFFORT_DATA_CHAT: 'medium' }), 'medium')
})

test('walidacja wejscia', () => {
	assert.throws(() => buildChatCompletionBody({ messages }), /model is required/)
	assert.throws(() => buildChatCompletionBody({ model: 'gpt-4o-mini', messages: [] }), /non-empty/)
})
