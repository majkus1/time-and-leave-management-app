const test = require('node:test')
const assert = require('node:assert/strict')

const {
	HELP_MAX_TURNS,
	HELP_MAX_MESSAGE_LENGTH,
	normalizeHelpMessages,
	highestRole,
	buildTeamPlanContext,
	buildHelpSystemPrompt,
	isKnownHelpModule,
} = require('../utils/aiHelpPrompt')

const NOW = new Date('2026-09-17T10:00:00Z')

const entitlements = over => ({
	planKey: null,
	billingStatus: null,
	billingCycle: null,
	trialEndsAt: null,
	freemiumTier: false,
	freemiumSeatBlocked: false,
	billingPeriodEnd: null,
	modules: { effectiveKeys: [] },
	...over,
})

test('statyczny prefiks jest identyczny dla różnych pytań i modułów w tej samej locale (warunek cache OpenAI)', () => {
	const a = buildHelpSystemPrompt({ locale: 'pl', moduleId: 'qr', teamPlanContext: 'A' })
	const b = buildHelpSystemPrompt({ locale: 'pl', moduleId: 'packages', teamPlanContext: 'B' })
	assert.equal(a.staticPrefix, b.staticPrefix)
	assert.ok(a.system.startsWith(a.staticPrefix))
	assert.ok(b.system.startsWith(a.staticPrefix))
	assert.equal(a.promptCacheKey, b.promptCacheKey)
	assert.match(a.promptCacheKey, /^planopia:help:pl:[0-9a-f]{12}$/)
	const en = buildHelpSystemPrompt({ locale: 'en' })
	assert.notEqual(en.staticPrefix, a.staticPrefix)
	assert.match(en.promptCacheKey, /^planopia:help:en:/)
})

test('prompt pomocy nie zawiera DATA CONTEXT, zawiera wszystkie moduły i „czego nie ma”', () => {
	const { system, staticPrefix } = buildHelpSystemPrompt({ locale: 'pl' })
	assert.ok(!/DATA CONTEXT/.test(system))
	assert.ok(!/VERIFIED STATS/.test(system))
	for (const title of ['## Kody QR', '## Urlopy', '## Pakiety, ceny i płatności', '## Asystent AI', '## Grafiki pracy']) {
		assert.ok(staticPrefix.includes(title), title)
	}
	assert.ok(staticPrefix.includes('### Czego Planopia nie ma'))
	assert.ok(!staticPrefix.includes('{{'))
	assert.ok(staticPrefix.includes('Nie sprawdza lokalizacji GPS'))
})

test('wybrany moduł i kontekst planu trafiają na koniec, po statycznym prefiksie', () => {
	const { system, staticPrefix, moduleId } = buildHelpSystemPrompt({ locale: 'pl', moduleId: 'qr', teamPlanContext: '--- TEAM PLAN CONTEXT ---\nx' })
	assert.equal(moduleId, 'qr')
	const tail = system.slice(staticPrefix.length)
	assert.ok(tail.includes('Użytkownik wybrał w panelu pomocy moduł „Kody QR — wejście i wyjście”'))
	assert.ok(tail.includes('--- TEAM PLAN CONTEXT ---'))
	assert.equal(buildHelpSystemPrompt({ locale: 'pl', moduleId: 'nope' }).moduleId, null)
	assert.equal(isKnownHelpModule('leave'), true)
	assert.equal(isKnownHelpModule('__proto__'), false)
})

test('TEAM PLAN CONTEXT: plan darmowy, blokada miejsc, trial, pakiet z modułami — bez danych osobowych', () => {
	const free = buildTeamPlanContext({ locale: 'pl', roles: ['Pracownik (Worker)'], entitlements: entitlements({ freemiumTier: true }), now: NOW })
	assert.ok(free.includes('plan darmowy (po okresie próbnym)'))
	assert.ok(free.includes('Rola pytającego: Pracownik'))

	const blocked = buildTeamPlanContext({ locale: 'pl', roles: ['Admin'], entitlements: entitlements({ freemiumTier: true, freemiumSeatBlocked: true }), now: NOW })
	assert.ok(blocked.includes('PONAD limit'))
	assert.ok(blocked.includes('Rola pytającego: Administrator'))

	const trial = buildTeamPlanContext({ locale: 'en', roles: ['HR'], entitlements: entitlements({ trialEndsAt: '2026-09-27T10:00:00Z' }), now: NOW })
	assert.ok(trial.includes('trial, 10 day(s) left'))
	assert.ok(trial.includes('Role of the person asking: HR'))

	const pro = buildTeamPlanContext({
		locale: 'pl',
		roles: ['Przełożony (Supervisor)', 'Pracownik (Worker)'],
		entitlements: entitlements({ planKey: 'base_m', billingStatus: 'active', billingCycle: 'annual', modules: { effectiveKeys: ['timer_qr', 'chat'] } }),
		now: NOW,
	})
	assert.ok(pro.includes('pakiet płatny Core M (rocznie)'))
	assert.ok(pro.includes('Aktywne moduły: Licznik + QR, Czat'))
	assert.ok(pro.includes('Rola pytającego: Przełożony'))

	// Wygasły pakiet: billingStatus 'active' + planKey zostają, ale freemiumTier/koniec okresu decydują → plan darmowy, nie „Core S”
	const lapsed = buildTeamPlanContext({ locale: 'pl', roles: ['Admin'], entitlements: entitlements({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: '2026-08-01T00:00:00Z', freemiumTier: true }), now: NOW })
	assert.ok(lapsed.includes('plan darmowy'), lapsed)
	assert.ok(!lapsed.includes('Core S'))
	const lapsedNoFlag = buildTeamPlanContext({ locale: 'pl', roles: ['Admin'], entitlements: entitlements({ planKey: 'base_s', billingStatus: 'active', billingPeriodEnd: '2026-08-01T00:00:00Z' }), now: NOW })
	assert.ok(!lapsedNoFlag.includes('pakiet płatny'))
	const trialKey = buildTeamPlanContext({ locale: 'pl', roles: [], entitlements: entitlements({ planKey: 'trial', trialEndsAt: '2026-09-27T10:00:00Z' }), now: NOW })
	assert.ok(trialKey.includes('okres próbny'))

	// Trial skończony, ale flaga freemium jeszcze nie policzona (np. legacy) → stan nieznany, bez zgadywania
	const unknown = buildTeamPlanContext({ locale: 'pl', roles: [], entitlements: entitlements({ trialEndsAt: '2026-01-01T00:00:00Z' }), now: NOW })
	assert.ok(unknown.includes('nieznany'))
	assert.ok(!/@|imię|nazwisko/i.test(unknown))
})

test('normalizeHelpMessages: role, długość, liczba tur; highestRole wg hierarchii', () => {
	const msgs = Array.from({ length: HELP_MAX_TURNS + 5 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }))
	const out = normalizeHelpMessages([{ role: 'system', content: 'x' }, { role: 'user', content: '   ' }, ...msgs])
	assert.equal(out.length, HELP_MAX_TURNS)
	assert.equal(out[out.length - 1].content, `m${HELP_MAX_TURNS + 4}`)
	assert.equal(normalizeHelpMessages([{ role: 'user', content: 'a'.repeat(HELP_MAX_MESSAGE_LENGTH + 50) }])[0].content.length, HELP_MAX_MESSAGE_LENGTH)
	assert.deepEqual(normalizeHelpMessages('nope'), [])
	assert.equal(highestRole(['Pracownik (Worker)', 'HR']), 'HR')
	assert.equal(highestRole(['Przełożony (Supervisor)']), 'Przełożony (Supervisor)')
	assert.equal(highestRole(undefined), 'Pracownik (Worker)')
})
