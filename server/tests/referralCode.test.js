const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { normalizeReferralCode, isSelfReferral, canReceiveReferrals } = require('../utils/referralCode')
const { isPlatformSuperAdminActivityAllowed } = require('../services/freemiumApiPolicyService')

describe('kody polecające programu partnerskiego', () => {
	it('normalizacja: małe litery, cyfry i myślnik, 3–32 znaki', () => {
		assert.equal(normalizeReferralCode('Biuro123'), 'biuro123')
		assert.equal(normalizeReferralCode('  biuro-kadry  '), 'biuro-kadry')
		assert.equal(normalizeReferralCode('ab'), null)
		assert.equal(normalizeReferralCode('-biuro'), null)
		assert.equal(normalizeReferralCode('biuro-'), null)
		assert.equal(normalizeReferralCode('biuro 123'), null)
		assert.equal(normalizeReferralCode('biuro_123'), null)
		assert.equal(normalizeReferralCode('a'.repeat(33)), null)
		assert.equal(normalizeReferralCode('<script>'), null)
		assert.equal(normalizeReferralCode(null), null)
	})

	it('samopolecenie: ten sam zespół, e-mail albo NIP', () => {
		const partner = { email: 'Biuro@Firma.pl', nip: 'PL 123-456-78-90', partnerTeamId: 'aaaaaaaaaaaaaaaaaaaaaaaa' }
		assert.equal(isSelfReferral({ partner, adminEmail: 'biuro@firma.pl' }), true)
		assert.equal(isSelfReferral({ partner, teamId: 'aaaaaaaaaaaaaaaaaaaaaaaa' }), true)
		assert.equal(isSelfReferral({ partner, nip: '1234567890' }), true)
		assert.equal(isSelfReferral({ partner, adminEmail: 'klient@inna.pl', nip: '9999999999' }), false)
		// Krótki / pusty NIP nie dopasowuje się przypadkiem
		assert.equal(isSelfReferral({ partner: { email: 'x@y.pl', nip: '' }, nip: '' }), false)
		assert.equal(isSelfReferral({ partner: null, adminEmail: 'x@y.pl' }), false)
	})

	it('polecenia przyjmuje tylko aktywny partner z poprawnym kodem', () => {
		assert.equal(canReceiveReferrals({ status: 'active', code: 'biuro123' }), true)
		assert.equal(canReceiveReferrals({ status: 'paused', code: 'biuro123' }), false)
		assert.equal(canReceiveReferrals({ status: 'active', code: '' }), false)
		assert.equal(canReceiveReferrals(null), false)
	})

	it('panel admina /api/super/* poza strażnikiem planu tylko dla właściciela platformy', () => {
		const owner = { username: 'michalipka1@gmail.com' }
		assert.equal(isPlatformSuperAdminActivityAllowed('/api/super/partners', owner), true)
		assert.equal(isPlatformSuperAdminActivityAllowed('/api/super/activity/overview', owner), true)
		assert.equal(isPlatformSuperAdminActivityAllowed('/api/super/partners', { username: 'admin@firma.pl' }), false)
		assert.equal(isPlatformSuperAdminActivityAllowed('/api/superpartners', owner), false)
		assert.equal(isPlatformSuperAdminActivityAllowed('/api/partners', owner), false)
	})
})
