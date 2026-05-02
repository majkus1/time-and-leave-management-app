const { appUrl } = require('../../config')

function parseBool(v) {
	return v === 'true' || v === '1'
}

function getStripeConfig() {
	const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim()
	const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
	const appPublicUrl = (process.env.STRIPE_APP_PUBLIC_URL || appUrl || '').replace(/\/$/, '')
	const sandbox = parseBool(process.env.STRIPE_SANDBOX)

	const credsOk = secretKey.length > 0
	const webhookOk = webhookSecret.length > 0
	const appOk = /^https?:\/\/.+/i.test(appPublicUrl)

	return {
		secretKey,
		webhookSecret,
		appPublicUrl,
		sandbox,
		credsOk,
		webhookOk,
		ready: credsOk && webhookOk && appOk,
	}
}

module.exports = { getStripeConfig }
