const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
	commissionMonth,
	isValidMonth,
	evaluateCommission,
	stripeInvoiceNetGrosze,
	refundReversalDelta,
	manualReversalAmount,
	summarizeEntries,
	isFutureDay,
	commissionLastDay,
} = require('../utils/commissionCalc')

const PARTNER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const partner = { _id: PARTNER_ID, status: 'active', commissionRate: 0.2, commissionMonths: 12, email: 'biuro@biuro.pl', nip: '1111111111' }
const team = {
	_id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
	referredByPartnerId: PARTNER_ID,
	referredAt: new Date('2026-01-15T10:00:00Z'),
	adminEmail: 'szef@firma.pl',
	billingInvoiceNip: '2222222222',
}

describe('prowizje programu partnerskiego', () => {
	it('naliczenie od kwoty netto, zaokrąglone do grosza', () => {
		const r = evaluateCommission({ partner, team, netGrosze: 14999, paidAt: new Date('2026-02-01T12:00:00Z') })
		assert.deepEqual(r, { eligible: true, rate: 0.2, commissionGrosze: 3000, month: '2026-02' })
	})

	it('okno miesięcy: 12 miesięcy od pierwszej płatności (czas polski), dzień rocznicy już poza oknem', () => {
		const firstPaidAt = new Date('2026-01-15T10:00:00Z')
		// 14.01.2027 23:00 w Polsce — ostatni dzień okna
		const inside = evaluateCommission({ partner, team, netGrosze: 10000, paidAt: new Date('2027-01-14T22:00:00Z'), firstPaidAt })
		assert.equal(inside.eligible, true)
		// 15.01.2027 00:30 w Polsce — rocznica pierwszej płatności
		const after = evaluateCommission({ partner, team, netGrosze: 10000, paidAt: new Date('2027-01-14T23:30:00Z'), firstPaidAt })
		assert.deepEqual(after, { eligible: false, reason: 'window_expired' })
		// Pierwsza płatność dopiero po 5 miesiącach próby/darmowego planu — okres liczy się od niej, nie od polecenia
		const late = new Date('2026-06-20T10:00:00Z')
		assert.equal(evaluateCommission({ partner, team, netGrosze: 10000, paidAt: late }).eligible, true)
		assert.equal(evaluateCommission({ partner, team, netGrosze: 10000, paidAt: new Date('2027-06-19T10:00:00Z'), firstPaidAt: late }).eligible, true)
		assert.equal(evaluateCommission({ partner, team, netGrosze: 10000, paidAt: new Date('2027-06-20T10:00:00Z'), firstPaidAt: late }).reason, 'window_expired')
		// Faktura dopisana z datą sprzed zapisanej pierwszej płatności — okres liczy się od wcześniejszej
		assert.equal(evaluateCommission({ partner, team, netGrosze: 10000, paidAt: new Date('2026-03-01T10:00:00Z'), firstPaidAt: late }).eligible, true)
		const unlimited = evaluateCommission({ partner: { ...partner, commissionMonths: null }, team, netGrosze: 10000, paidAt: new Date('2031-06-01') })
		assert.equal(unlimited.eligible, true)
	})

	it('po okresie druga stawka bez limitu (25% przez 12 mies., potem 10%)', () => {
		const p2 = { ...partner, commissionRate: 0.25, commissionMonths: 12, laterCommissionRate: 0.1 }
		const firstPaidAt = new Date('2026-01-15T10:00:00Z')
		const inWindow = evaluateCommission({ partner: p2, team, netGrosze: 20000, paidAt: new Date('2026-12-15T10:00:00Z'), firstPaidAt })
		assert.equal(inWindow.rate, 0.25)
		assert.equal(inWindow.commissionGrosze, 5000)
		const later = evaluateCommission({ partner: p2, team, netGrosze: 20000, paidAt: new Date('2027-01-15T10:00:00Z'), firstPaidAt })
		assert.equal(later.rate, 0.1)
		assert.equal(later.commissionGrosze, 2000)
		const yearsLater = evaluateCommission({ partner: p2, team, netGrosze: 20000, paidAt: new Date('2030-05-15T10:00:00Z'), firstPaidAt })
		assert.equal(yearsLater.commissionGrosze, 2000)
		// Bez drugiej stawki — po okresie koniec
		assert.equal(evaluateCommission({ partner: { ...p2, laterCommissionRate: 0 }, team, netGrosze: 20000, paidAt: new Date('2027-01-15T10:00:00Z'), firstPaidAt }).reason, 'window_expired')
	})

	it('bez polecenia, inny partner, wstrzymany partner, zero zł — bez prowizji', () => {
		const paidAt = new Date('2026-03-01')
		assert.equal(evaluateCommission({ partner, team: { ...team, referredByPartnerId: null }, netGrosze: 100, paidAt }).reason, 'no_partner')
		assert.equal(evaluateCommission({ partner: { ...partner, _id: 'cccccccccccccccccccccccc' }, team, netGrosze: 100, paidAt }).reason, 'no_partner')
		assert.equal(evaluateCommission({ partner: { ...partner, status: 'paused' }, team, netGrosze: 100, paidAt }).reason, 'partner_paused')
		assert.equal(evaluateCommission({ partner, team, netGrosze: 0, paidAt }).reason, 'zero_amount')
		assert.equal(evaluateCommission({ partner: { ...partner, commissionRate: 0 }, team, netGrosze: 100, paidAt }).reason, 'zero_rate')
	})

	it('płatność sprzed polecenia — bez prowizji; z dnia polecenia (faktura z datą bez godziny) — z prowizją', () => {
		const assigned = { ...team, referredAt: new Date('2026-10-13T10:00:00Z') }
		assert.deepEqual(evaluateCommission({ partner, team: assigned, netGrosze: 10000, paidAt: new Date('2026-09-01') }), { eligible: false, reason: 'before_referral' })
		assert.equal(evaluateCommission({ partner, team: assigned, netGrosze: 10000, paidAt: new Date('2026-10-12T21:59:00Z') }).reason, 'before_referral')
		assert.equal(evaluateCommission({ partner, team: assigned, netGrosze: 10000, paidAt: new Date('2026-10-13') }).eligible, true)
	})

	it('data z przyszłości liczona w dniach czasu polskiego', () => {
		const now = new Date('2026-10-31T09:00:00Z')
		assert.equal(isFutureDay(new Date('2026-10-31'), now), false)
		assert.equal(isFutureDay(new Date('2026-11-01'), now), true)
		// 31.10 o 23:30 w Polsce: 1.11 nadal przyszłe; o 00:30 1.11 już nie
		assert.equal(isFutureDay(new Date('2026-11-01'), new Date('2026-10-31T22:30:00Z')), true)
		assert.equal(isFutureDay(new Date('2026-11-01'), new Date('2026-10-31T23:30:00Z')), false)
	})

	it('samopolecenie przy naliczaniu: NIP z faktury firmy = NIP partnera', () => {
		const r = evaluateCommission({ partner, team: { ...team, billingInvoiceNip: '111-111-11-11' }, netGrosze: 10000, paidAt: new Date('2026-03-01') })
		assert.deepEqual(r, { eligible: false, reason: 'self_referral' })
	})

	it('miesiąc rozliczeniowy w czasie polskim', () => {
		assert.equal(commissionMonth(new Date('2026-01-31T23:30:00Z')), '2026-02')
		assert.equal(commissionMonth(new Date('2026-01-31T22:30:00Z')), '2026-01')
		assert.equal(isValidMonth('2026-02'), true)
		assert.equal(isValidMonth('2026-13'), false)
		assert.equal(isValidMonth({ $gt: '' }), false)
	})

	it('faktura Stripe: netto = zapłacono, podatek odcięty proporcjonalnie', () => {
		assert.equal(stripeInvoiceNetGrosze({ amount_paid: 14900, total: 14900, total_excluding_tax: 14900 }), 14900)
		assert.equal(stripeInvoiceNetGrosze({ amount_paid: 12300, total: 12300, total_excluding_tax: 10000 }), 10000)
		// Część pokryta kredytem klienta: zapłacono połowę brutto → połowa netto
		assert.equal(stripeInvoiceNetGrosze({ amount_paid: 6150, total: 12300, total_excluding_tax: 10000 }), 5000)
		assert.equal(stripeInvoiceNetGrosze({ amount_paid: 0, total: 0 }), 0)
		assert.equal(stripeInvoiceNetGrosze({ amount_paid: 5000 }), 5000)
	})

	it('zwrot Stripe: częściowy, potem pełny, ponowione i spóźnione zdarzenia', () => {
		const base = { accrualCommissionGrosze: 3000, chargeAmountGrosze: 15000 }
		assert.equal(refundReversalDelta({ ...base, refundedTotalGrosze: 5000, alreadyReversedGrosze: 0 }), 1000)
		// To samo zdarzenie ponownie — już cofnięte 1000
		assert.equal(refundReversalDelta({ ...base, refundedTotalGrosze: 5000, alreadyReversedGrosze: 1000 }), 0)
		// Reszta zwrotu
		assert.equal(refundReversalDelta({ ...base, refundedTotalGrosze: 15000, alreadyReversedGrosze: 1000 }), 2000)
		// Spóźnione wcześniejsze zdarzenie po pełnym zwrocie
		assert.equal(refundReversalDelta({ ...base, refundedTotalGrosze: 5000, alreadyReversedGrosze: 3000 }), 0)
		// Zwrot większy niż ładunek (błędne dane) — nie więcej niż prowizja
		assert.equal(refundReversalDelta({ ...base, refundedTotalGrosze: 99999, alreadyReversedGrosze: 0 }), 3000)
	})

	it('ręczne cofnięcie: od zwróconej kwoty netto, najwyżej pozostała prowizja', () => {
		assert.equal(manualReversalAmount({ accrualCommissionGrosze: 3000, rate: 0.2, refundedNetGrosze: 5000 }), 1000)
		assert.equal(manualReversalAmount({ accrualCommissionGrosze: 3000, rate: 0.2, refundedNetGrosze: 50000, alreadyReversedGrosze: 1000 }), 2000)
		assert.equal(manualReversalAmount({ accrualCommissionGrosze: 3000, rate: 0.2, refundedNetGrosze: 5000, alreadyReversedGrosze: 3000 }), 0)
		assert.equal(manualReversalAmount({ accrualCommissionGrosze: 3000, rate: 0.2, refundedNetGrosze: -5000 }), 0)
	})

	it('podsumowanie: cofnięcia odejmują się w swoim statusie', () => {
		const s = summarizeEntries([
			{ commissionGrosze: 3000, status: 'paid' },
			{ commissionGrosze: 2000, status: 'payable' },
			{ commissionGrosze: -1000, status: 'accrued' },
			{ commissionGrosze: 500, status: 'accrued' },
		])
		assert.deepEqual(s, { accrued: -500, payable: 2000, paid: 3000, total: 4500, count: 4 })
	})

	it('ostatni dzień prowizji do wyświetlenia: dzień przed rocznicą (czas polski)', () => {
		const last = commissionLastDay(new Date('2026-03-15T10:00:00Z'), 12)
		assert.equal(last.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }), '14.03.2027')
		assert.equal(commissionLastDay(new Date('2026-03-15T10:00:00Z'), null), null)
	})
})
