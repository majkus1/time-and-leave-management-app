const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { mapQrServiceError } = require('../utils/safeHttpErrors')

describe('safeHttpErrors', () => {
	it('maps QR validation without leaking mongo errors', () => {
		const r = mapQrServiceError(new Error('Nazwa kodu QR jest wymagana'), 'fallback')
		assert.equal(r.status, 400)
		assert.equal(r.body.message, 'Nazwa kodu QR jest wymagana')
	})

	it('returns generic 500 for unknown errors', () => {
		const r = mapQrServiceError(new Error('E11000 duplicate key'), 'Błąd podczas generowania kodu QR')
		assert.equal(r.status, 500)
		assert.equal(r.body.message, 'Błąd podczas generowania kodu QR')
		assert.ok(!r.body.message.includes('E11000'))
	})
})
