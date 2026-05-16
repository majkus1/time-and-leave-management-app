const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
	getClientSafeMessage,
	billingClientErrorPayload,
	billingServiceUnavailablePayload,
	billingGatewayErrorPayload,
} = require('../utils/clientSafeErrors')

describe('clientSafeErrors', () => {
	it('masks config-related error messages', () => {
		const err = new Error('OPENAI_API_KEY is not configured')
		err.code = 'OPENAI_NOT_CONFIGURED'
		const msg = getClientSafeMessage(err)
		assert.ok(!msg.includes('OPENAI_API_KEY'))
		assert.ok(msg.includes('Asystent AI'))
	})

	it('masks Stripe config in billing payload', () => {
		const err = new Error('Stripe is not configured (missing STRIPE_SECRET_KEY).')
		err.code = 'STRIPE_NOT_CONFIGURED'
		const payload = billingServiceUnavailablePayload(err)
		assert.equal(payload.code, 'STRIPE_NOT_CONFIGURED')
		assert.ok(!payload.message.includes('STRIPE_SECRET_KEY'))
	})

	it('keeps business validation messages', () => {
		const err = new Error('Brak mapowania planu.')
		err.code = 'VALIDATION'
		assert.equal(getClientSafeMessage(err), 'Brak mapowania planu.')
	})

	it('masks STRIPE_CONFIG in billingClientErrorPayload', () => {
		const err = new Error('Invalid STRIPE_PRICE_MAP_JSON')
		err.code = 'STRIPE_CONFIG'
		const payload = billingClientErrorPayload(err)
		assert.ok(!payload.message.includes('STRIPE_PRICE_MAP_JSON'))
	})

	it('masks P24 API response in billingGatewayErrorPayload', () => {
		const err = new Error('P24 transaction/register failed: {"responseCode":1,"error":"invalid crc"}')
		err.code = 'P24_API'
		const payload = billingGatewayErrorPayload(err)
		assert.equal(payload.code, 'P24_API')
		assert.ok(!payload.message.includes('invalid crc'))
		assert.ok(!payload.message.includes('responseCode'))
	})
})
