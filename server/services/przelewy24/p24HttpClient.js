const { getP24Config } = require('./p24Config')

/**
 * @param {string} method
 * @param {string} path - zaczyna się od /api/v1/...
 * @param {object} [jsonBody]
 */
async function p24Request(method, path, jsonBody) {
	const cfg = getP24Config()
	const fixedPath = path.startsWith('/') ? path : `/${path}`
	const fullUrl = `${cfg.apiBase}${fixedPath}`

	const auth = Buffer.from(`${cfg.posId}:${cfg.apiKey}`, 'utf8').toString('base64')

	const headers = {
		Authorization: `Basic ${auth}`,
		Accept: 'application/json',
	}
	if (jsonBody != null && method !== 'GET' && method !== 'HEAD') {
		headers['Content-Type'] = 'application/json'
	}

	const res = await fetch(fullUrl, {
		method,
		headers,
		body: jsonBody != null ? JSON.stringify(jsonBody) : undefined,
	})

	const text = await res.text()
	let json
	try {
		json = text ? JSON.parse(text) : {}
	} catch {
		console.error(
			'[p24] invalid JSON response:',
			res.status,
			text.slice(0, 240)
		)
		const err = new Error('P24 invalid JSON response')
		err.code = 'P24_PARSE'
		err.httpStatus = res.status
		throw err
	}

	return { status: res.status, json }
}

function assertP24Ok(json, context) {
	if (json != null && Number(json.responseCode) === 0) return
	const detail = json?.error ?? json
	console.error(`[p24] API ${context} responseCode != 0`, detail)
	const err = new Error(`P24 ${context} failed`)
	err.code = 'P24_API'
	err.p24Response = json
	throw err
}

module.exports = { p24Request, assertP24Ok }
