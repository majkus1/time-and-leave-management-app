const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
	planChangeNeedsRequest,
	onlinePurchasablePlan,
	manualActivationModuleKeys,
	manualActivationConflicts,
	isEarlyRenewal,
	renewalFinalizeDecision,
} = require('../utils/billingPlanChange')

describe('planChangeNeedsRequest — zmiana planu tylko zgłoszeniem, gdy plan jest opłacony', () => {
	it('opłacony plan (także z góry przez P24) — zgłoszenie', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: true }), true)
	})

	it('subskrypcja kartą w trakcie ponawiania płatności (karencja) — zgłoszenie, bo Stripe dalej pobiera', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'past_due' }), true)
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'unpaid' }), true)
	})

	it('anulowana albo wygasła subskrypcja kartą — można kupić nowy plan', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'canceled' }), false)
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'incomplete_expired' }), false)
	})

	it('okres próbny, plan darmowy albo wygasły plan — zwykły zakup', () => {
		assert.equal(planChangeNeedsRequest({ paidActive: false }), false)
		assert.equal(planChangeNeedsRequest({ paidActive: false, stripeSubscriptionId: null, stripeSubscriptionStatus: 'active' }), false)
		assert.equal(planChangeNeedsRequest(null), false)
	})
})

describe('onlinePurchasablePlan — online tylko plany w sprzedaży', () => {
	it('nowe i stare klucze w sprzedaży, alias starter', () => {
		for (const k of ['base_5', 'base_s', 'base_m', 'base_50', 'base_l', 'pro_15', 'pro', 'pro_50', 'business', 'starter']) {
			assert.equal(onlinePurchasablePlan(k), true, k)
		}
	})

	it('Enterprise i nieznane klucze nie', () => {
		assert.equal(onlinePurchasablePlan('enterprise'), false)
		assert.equal(onlinePurchasablePlan('trial'), false)
		assert.equal(onlinePurchasablePlan(undefined), false)
	})
})

describe('manualActivationModuleKeys — moduły przy ręcznej aktywacji', () => {
	it('Core wymaga jawnej listy (także pustej), żeby nie skasować modułów po cichu', () => {
		assert.throws(() => manualActivationModuleKeys('base_s', undefined), { code: 'VALIDATION' })
		assert.deepEqual(manualActivationModuleKeys('base_s', []), [])
		assert.deepEqual(manualActivationModuleKeys('base_s', ['timer_qr', 'tasks_chat']), ['timer_qr', 'tasks_chat'])
	})

	it('stare moduły klientów (np. osobny czat) są dozwolone', () => {
		assert.deepEqual(manualActivationModuleKeys('base_m', ['tasks', 'chat']), ['tasks', 'chat'])
	})

	it('pakiety bez modułów; błędy na nieznanym i zduplikowanym module', () => {
		assert.deepEqual(manualActivationModuleKeys('pro', undefined), [])
		assert.deepEqual(manualActivationModuleKeys('business', []), [])
		assert.throws(() => manualActivationModuleKeys('pro', ['timer_qr']), { code: 'VALIDATION' })
		assert.throws(() => manualActivationModuleKeys('base_s', ['kanban']), { code: 'VALIDATION' })
		assert.throws(() => manualActivationModuleKeys('base_s', ['timer_qr', 'timer_qr']), { code: 'VALIDATION' })
		assert.throws(() => manualActivationModuleKeys('base_s', 'timer_qr'), { code: 'VALIDATION' })
	})

	it('nieznany plan — komunikat o planie, nie o modułach', () => {
		assert.throws(() => manualActivationModuleKeys('trial', ['timer_qr']), { code: 'VALIDATION', message: 'Nieznany plan.' })
		assert.deepEqual(manualActivationModuleKeys('starter', ['timer_qr']), ['timer_qr'])
	})
})

describe('manualActivationConflicts — strażnicy ręcznej aktywacji', () => {
	const now = new Date('2026-11-16T10:00:00Z')
	const inDays = d => new Date(now.getTime() + d * 86400000)
	const codes = r => r.conflicts.map(c => c.code)

	it('data z przeszłości (np. z maila sprzed odnowienia) — odmowa', () => {
		const r = manualActivationConflicts({ team: {}, periodEnd: inDays(-1), now })
		assert.deepEqual(codes(r), ['PERIOD_END_IN_PAST'])
	})

	it('skracanie opłaconego okresu (zespół w międzyczasie opłacił dłużej) — odmowa; ta sama albo dłuższa data przechodzi', () => {
		const team = { billingPeriodEnd: inDays(30) }
		assert.deepEqual(codes(manualActivationConflicts({ team, periodEnd: inDays(10), now })), ['PERIOD_END_SHORTENS_PAID'])
		assert.deepEqual(codes(manualActivationConflicts({ team, periodEnd: inDays(30), now })), [])
		assert.deepEqual(codes(manualActivationConflicts({ team, periodEnd: inDays(60), now })), [])
	})

	it('po anulowaniu w Stripe (w bazie data anulowania, status canceled) — przeniesiona data przechodzi', () => {
		const team = { billingPeriodEnd: inDays(-0.01), stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'canceled' }
		const r = manualActivationConflicts({ team, periodEnd: inDays(20), now })
		assert.deepEqual(codes(r), [])
		assert.equal(r.stripeCancelRequired, false)
	})

	it('działająca subskrypcja Stripe — aktywacja odmawia (webhooki by ją nadpisały)', () => {
		for (const status of ['active', 'trialing', 'past_due', 'unpaid']) {
			const team = { billingPeriodEnd: inDays(20), stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: status }
			assert.ok(codes(manualActivationConflicts({ team, periodEnd: inDays(20), now })).includes('STRIPE_SUBSCRIPTION_LIVE'), status)
		}
	})

	it('na sucho przed anulowaniem: subskrypcja to krok do zrobienia, a obecnego końca okresu nie porównujemy', () => {
		// Anulowanie i tak wpisze w bazie datę anulowania — porównanie z obecnym końcem niczego by nie chroniło
		const team = { billingPeriodEnd: inDays(25), stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'active' }
		const r = manualActivationConflicts({ team, periodEnd: inDays(18), now, dryRun: true })
		assert.deepEqual(codes(r), [])
		assert.equal(r.stripeCancelRequired, true)
	})

	it('zaległość kartą (także powstała po zgłoszeniu) — już na sucho odmowa, żeby nie przenieść nieopłaconego okresu', () => {
		for (const status of ['past_due', 'unpaid']) {
			const team = { billingPeriodEnd: inDays(6), stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: status }
			const r = manualActivationConflicts({ team, periodEnd: inDays(30), now, dryRun: true })
			assert.deepEqual(codes(r), ['STRIPE_PAYMENT_PAST_DUE'], status)
			assert.match(r.conflicts[0].message, /zaległą płatność/)
		}
	})

	it('nieaktualny „żywy” status potwierdzony jako zakończony (stripeSubscriptionEnded) — bez blokady Stripe', () => {
		for (const status of ['active', 'past_due']) {
			const team = { billingPeriodEnd: inDays(-150), stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: status }
			const r = manualActivationConflicts({ team, periodEnd: inDays(30), now, stripeSubscriptionEnded: true })
			assert.deepEqual(codes(r), [], status)
			assert.equal(r.stripeCancelRequired, false)
		}
		// Bez potwierdzenia ten sam stan blokuje
		const stale = { billingPeriodEnd: inDays(-150), stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'active' }
		assert.deepEqual(codes(manualActivationConflicts({ team: stale, periodEnd: inDays(30), now })), ['STRIPE_SUBSCRIPTION_LIVE'])
	})

	it('na sucho bez Stripe (P24) — skracanie dalej wykrywane', () => {
		const r = manualActivationConflicts({ team: { billingPeriodEnd: inDays(30) }, periodEnd: inDays(10), now, dryRun: true })
		assert.deepEqual(codes(r), ['PERIOD_END_SHORTENS_PAID'])
	})

	it('rozliczenie osobne bez daty końca (np. Halo, faktura) — odmowa, żeby nie nadać daty, po której zniknie dostęp', () => {
		const team = { billingStatus: 'active', billingPlanKey: 'starter', billingPeriodEnd: null }
		assert.deepEqual(codes(manualActivationConflicts({ team, periodEnd: inDays(365), now })), ['OPEN_ENDED_BILLING'])
		assert.deepEqual(codes(manualActivationConflicts({ team, periodEnd: inDays(365), now, dryRun: true })), ['OPEN_ENDED_BILLING'])
	})

	it('zwykłe zamówienie (okres próbny, brak planu, wygasły plan z datą) — bez blokady „bez daty końca”', () => {
		for (const team of [
			{ billingStatus: null, billingPlanKey: 'trial', billingPeriodEnd: null },
			{},
			{ billingStatus: 'active', billingPlanKey: 'base_s', billingPeriodEnd: inDays(-3) },
			{ billingStatus: 'inactive', billingPlanKey: 'pro', billingPeriodEnd: null },
		]) {
			assert.deepEqual(codes(manualActivationConflicts({ team, periodEnd: inDays(30), now })), [], JSON.stringify(team))
		}
	})
})

describe('isEarlyRenewal — przedłużenie BLIK / przelewem przed końcem okresu', () => {
	const now = new Date('2026-10-10T10:00:00Z')
	const end = new Date('2026-10-15T10:00:00Z')
	const paidCore = { billingStatus: 'active', billingPlanKey: 'base_s', billingModuleKeys: ['timer_qr', 'tasks_chat'], billingPeriodEnd: end }

	it('ten sam plan i te same moduły (kolejność bez znaczenia)', () => {
		assert.equal(isEarlyRenewal({ team: paidCore, planKey: 'base_s', moduleKeys: ['tasks_chat', 'timer_qr'], at: now }), true)
	})

	it('stary klucz starter to ten sam plan co Core do 15 osób', () => {
		const team = { ...paidCore, billingPlanKey: 'starter', billingModuleKeys: [] }
		assert.equal(isEarlyRenewal({ team, planKey: 'base_s', moduleKeys: [], at: now }), true)
	})

	it('inne moduły albo inny plan — to zmiana planu, nie przedłużenie', () => {
		assert.equal(isEarlyRenewal({ team: paidCore, planKey: 'base_s', moduleKeys: ['timer_qr'], at: now }), false)
		assert.equal(isEarlyRenewal({ team: paidCore, planKey: 'base_m', moduleKeys: ['timer_qr', 'tasks_chat'], at: now }), false)
	})

	it('pakiet — liczy się tylko plan (moduły w cenie)', () => {
		const team = { billingStatus: 'active', billingPlanKey: 'pro', billingModuleKeys: ['timer_qr', 'schedules_ai', 'tasks', 'chat', 'ai_assistant'], billingPeriodEnd: end }
		assert.equal(isEarlyRenewal({ team, planKey: 'pro', moduleKeys: undefined, at: now }), true)
	})

	it('po końcu okresu, bez daty (osobna faktura), przy działającej karcie albo nieaktywnym planie — nie', () => {
		assert.equal(isEarlyRenewal({ team: paidCore, planKey: 'base_s', moduleKeys: ['timer_qr', 'tasks_chat'], at: new Date('2026-10-16T10:00:00Z') }), false)
		assert.equal(isEarlyRenewal({ team: { ...paidCore, billingPeriodEnd: null }, planKey: 'base_s', moduleKeys: ['timer_qr', 'tasks_chat'], at: now }), false)
		for (const stripeSubscriptionStatus of ['active', 'past_due']) {
			const team = { ...paidCore, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus }
			assert.equal(isEarlyRenewal({ team, planKey: 'base_s', moduleKeys: ['timer_qr', 'tasks_chat'], at: now }), false, stripeSubscriptionStatus)
		}
		assert.equal(isEarlyRenewal({ team: { ...paidCore, billingStatus: 'inactive' }, planKey: 'base_s', moduleKeys: ['timer_qr', 'tasks_chat'], at: now }), false)
		assert.equal(isEarlyRenewal({ team: null, planKey: 'base_s', moduleKeys: [], at: now }), false)
	})

	it('anulowana karta nie przeszkadza w przedłużeniu BLIK', () => {
		const team = { ...paidCore, stripeSubscriptionId: 'sub_old', stripeSubscriptionStatus: 'canceled' }
		assert.equal(isEarlyRenewal({ team, planKey: 'base_s', moduleKeys: ['timer_qr', 'tasks_chat'], at: now }), true)
	})
})

describe('renewalFinalizeDecision — okres z sesji, bez podwójnego wydłużenia i nadpisania zmiany planu', () => {
	const E = new Date('2026-10-15T10:00:00Z')
	const plusMonth = d => {
		const x = new Date(d.getTime())
		x.setMonth(x.getMonth() + 1)
		return x
	}
	const team = end => ({ billingPlanKey: 'base_s', billingModuleKeys: ['timer_qr'], billingPeriodEnd: end })
	const decide = (t, extra = {}) =>
		renewalFinalizeDecision({ team: t, planKey: 'base_s', moduleKeys: ['timer_qr'], renewFrom: E, otherRenewalPaid: false, periodEndFrom: plusMonth, ...extra })

	it('okres nieruszony od założenia sesji → od końca (także gdy płatność doszła po nim)', () => {
		assert.deepEqual(decide(team(E)), { action: 'extend', start: E })
	})

	it('ta sama płatność przetworzona drugi raz (webhook + powrót, ponowienie, ręczna aktywacja) → ten sam wynik, bez drugiego okresu', () => {
		const d = decide(team(plusMonth(E)))
		assert.equal(d.action, 'extend')
		assert.equal(plusMonth(d.start).toISOString(), plusMonth(E).toISOString())
	})

	it('inna płatność z tej samej daty już zaksięgowana → dokładamy po niej', () => {
		assert.deepEqual(decide(team(plusMonth(E)), { otherRenewalPaid: true }), { action: 'extend', start: plusMonth(E) })
	})

	it('okres już dłuższy niż wynik (np. ręczne przedłużenie) → bez skracania, do rozliczenia ręcznego', () => {
		assert.deepEqual(decide(team(new Date('2027-01-15T10:00:00Z'))), { action: 'skip', reason: 'already_covered' })
	})

	it('plan albo moduły zmienione w międzyczasie albo rozliczenie bez daty → zespół bez zmian', () => {
		assert.deepEqual(decide({ ...team(E), billingModuleKeys: ['timer_qr', 'tasks_chat'] }), { action: 'skip', reason: 'plan_changed' })
		assert.deepEqual(decide({ ...team(E), billingPlanKey: 'pro_15' }), { action: 'skip', reason: 'plan_changed' })
		assert.deepEqual(decide(team(null)), { action: 'skip', reason: 'plan_changed' })
		assert.deepEqual(decide(null), { action: 'skip', reason: 'plan_changed' })
	})
})
