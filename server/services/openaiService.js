/**
 * Thin wrapper around OpenAI Chat Completions API (no extra npm dependency).
 */

const DEFAULT_MODEL = 'gpt-4o-mini'
const API_URL = 'https://api.openai.com/v1/chat/completions'

function throwOpenAINotConfigured() {
	console.error('[openai] OPENAI_API_KEY is not configured')
	const err = new Error('OpenAI is not configured')
	err.code = 'OPENAI_NOT_CONFIGURED'
	throw err
}

/**
 * @param {object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string} [opts.model]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 */
exports.createChatCompletion = async function createChatCompletion({
	messages,
	model,
	temperature = 0.35,
	maxTokens = 4096,
}) {
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey || !apiKey.trim()) {
		throwOpenAINotConfigured()
	}

	const resolvedModel = (model || process.env.OPENAI_MODEL || DEFAULT_MODEL).trim()

	const res = await fetch(API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: resolvedModel,
			messages,
			temperature,
			max_tokens: maxTokens,
		}),
	})

	const data = await res.json().catch(() => ({}))

	if (!res.ok) {
		const msg = data?.error?.message || res.statusText || 'OpenAI request failed'
		const err = new Error(msg)
		err.code = 'OPENAI_HTTP_ERROR'
		err.status = res.status
		err.details = data
		throw err
	}

	const choice = data.choices && data.choices[0]
	const content = choice?.message?.content
	if (typeof content !== 'string') {
		const err = new Error('Empty or invalid response from OpenAI')
		err.code = 'OPENAI_EMPTY'
		throw err
	}

	return {
		content: content.trim(),
		model: data.model || resolvedModel,
		usage: data.usage || null,
	}
}

/**
 * Chat completion with JSON object response (for structured export intent, etc.).
 */
exports.createChatCompletionJson = async function createChatCompletionJson({
	messages,
	model,
	maxTokens = 500,
	temperature = 0.1,
}) {
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey || !apiKey.trim()) {
		throwOpenAINotConfigured()
	}

	const resolvedModel = (model || process.env.OPENAI_MODEL || DEFAULT_MODEL).trim()

	const res = await fetch(API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: resolvedModel,
			messages,
			temperature,
			max_tokens: maxTokens,
			response_format: { type: 'json_object' },
		}),
	})

	const data = await res.json().catch(() => ({}))

	if (!res.ok) {
		const msg = data?.error?.message || res.statusText || 'OpenAI request failed'
		const err = new Error(msg)
		err.code = 'OPENAI_HTTP_ERROR'
		err.status = res.status
		err.details = data
		throw err
	}

	const choice = data.choices && data.choices[0]
	const content = choice?.message?.content
	if (typeof content !== 'string') {
		const err = new Error('Empty or invalid response from OpenAI')
		err.code = 'OPENAI_EMPTY'
		throw err
	}

	return {
		content: content.trim(),
		model: data.model || resolvedModel,
		usage: data.usage || null,
	}
}

/**
 * Stream chat completion (OpenAI SSE). Yields { type: 'delta', text } then { type: 'done', model }.
 * @param {object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string} [opts.model]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @returns {AsyncGenerator<{ type: 'delta', text: string } | { type: 'done', model: string }, void, void>}
 */
exports.createChatCompletionStream = async function* createChatCompletionStream({
	messages,
	model,
	temperature = 0.35,
	maxTokens = 4096,
}) {
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey || !apiKey.trim()) {
		throwOpenAINotConfigured()
	}

	const resolvedModel = (model || process.env.OPENAI_MODEL || DEFAULT_MODEL).trim()

	const res = await fetch(API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: resolvedModel,
			messages,
			temperature,
			max_tokens: maxTokens,
			stream: true,
		}),
	})

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
	let lastModel = resolvedModel

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		buffer += decoder.decode(value, { stream: true })

		let sep
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const rawEvent = buffer.slice(0, sep)
			buffer = buffer.slice(sep + 2)

			const dataLine = rawEvent
				.split('\n')
				.map(l => l.replace(/\r$/, ''))
				.find(l => l.startsWith('data: '))

			if (!dataLine) continue
			const payload = dataLine.slice(6).trim()
			if (payload === '[DONE]') continue

			let json
			try {
				json = JSON.parse(payload)
			} catch {
				continue
			}

			if (json.error) {
				const err = new Error(json.error.message || 'OpenAI stream error')
				err.code = 'OPENAI_STREAM_ERROR'
				throw err
			}

			if (typeof json.model === 'string' && json.model) {
				lastModel = json.model
			}

			const delta = json.choices?.[0]?.delta?.content
			if (typeof delta === 'string' && delta.length > 0) {
				yield { type: 'delta', text: delta }
			}
		}
	}

	// Last chunk may omit trailing \n\n
	if (buffer.trim()) {
		const dataLine = buffer
			.split('\n')
			.map(l => l.replace(/\r$/, ''))
			.find(l => l.startsWith('data: '))
		if (dataLine) {
			const payload = dataLine.slice(6).trim()
			if (payload && payload !== '[DONE]') {
				try {
					const json = JSON.parse(payload)
					if (json.error) {
						const err = new Error(json.error.message || 'OpenAI stream error')
						err.code = 'OPENAI_STREAM_ERROR'
						throw err
					}
					if (typeof json.model === 'string' && json.model) {
						lastModel = json.model
					}
					const delta = json.choices?.[0]?.delta?.content
					if (typeof delta === 'string' && delta.length > 0) {
						yield { type: 'delta', text: delta }
					}
				} catch (e) {
					if (e.code === 'OPENAI_STREAM_ERROR') throw e
				}
			}
		}
	}

	yield { type: 'done', model: lastModel }
}

exports.isOpenAIConfigured = function isOpenAIConfigured() {
	return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
}
