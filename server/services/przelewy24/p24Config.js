const { appUrl } = require('../../config')

function parseBool(v) {
	return v === 'true' || v === '1'
}

/**
 * @returns {{
 *   merchantId: number,
 *   posId: number,
 *   crc: string,
 *   apiKey: string,
 *   sandbox: boolean,
 *   apiBase: string,
 *   trnHost: string,
 *   appPublicUrl: string,
 *   webhookUrl: string,
 *   credsOk: boolean,
 *   webhookOk: boolean,
 *   ready: boolean,
 * }}
 */
function getP24Config() {
	const merchantId = parseInt(process.env.P24_MERCHANT_ID, 10)
	const posId = parseInt(process.env.P24_POS_ID, 10)
	const crc = (process.env.P24_CRC || '').trim()
	const apiKey = (process.env.P24_API_KEY || '').trim()
	const sandbox = parseBool(process.env.P24_SANDBOX)

	const appPublicUrl = (process.env.P24_APP_PUBLIC_URL || appUrl || '').replace(/\/$/, '')

	let webhookUrl = (process.env.P24_WEBHOOK_URL || '').trim()
	if (!webhookUrl) {
		const apiPublic = (process.env.API_PUBLIC_URL || '').trim().replace(/\/$/, '')
		if (apiPublic) {
			webhookUrl = `${apiPublic}/api/billing/webhooks/przelewy24`
		}
	}

	const credsOk =
		Number.isFinite(merchantId) &&
		merchantId > 0 &&
		Number.isFinite(posId) &&
		posId > 0 &&
		crc.length > 0 &&
		apiKey.length > 0

	const webhookOk = /^https:\/\/.+/i.test(webhookUrl) && webhookUrl.length <= 500

	const apiBase = sandbox
		? 'https://sandbox.przelewy24.pl/api/v1'
		: 'https://secure.przelewy24.pl/api/v1'

	const trnHost = sandbox ? 'https://sandbox.przelewy24.pl' : 'https://secure.przelewy24.pl'

	return {
		merchantId,
		posId,
		crc,
		apiKey,
		sandbox,
		apiBase,
		trnHost,
		appPublicUrl,
		webhookUrl,
		credsOk,
		webhookOk,
		ready: credsOk && webhookOk,
	}
}

module.exports = { getP24Config }
