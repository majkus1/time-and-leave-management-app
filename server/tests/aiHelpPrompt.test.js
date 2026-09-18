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

	const trial = buildTeamPlanContext({ locale: 'en', roles: ['HR'], entitlements: entitlements({ planKey: 'trial', trialEndsAt: '2026-09-27T10:00:00Z' }), now: NOW })
	assert.ok(trial.includes('trial, 10 day(s) left'))
	assert.ok(trial.includes('Role of the person asking: HR'))

	const pro = buildTeamPlanContext({
		locale: 'pl',
		roles: ['Przełożony (Supervisor)', 'Pracownik (Worker)'],
		entitlements: entitlements({ planKey: 'base_m', billingStatus: 'active', billingCycle: 'annual', modules: { effectiveKeys: ['timer_qr', 'chat'] } }),
		now: NOW,
	})
	assert.ok(pro.includes('pakiet płatny Core M, rocznie'))
	// Brak cyklu (rozliczenie ręczne) — bez zgadywania „miesięcznie”
	const manual = buildTeamPlanContext({ locale: 'pl', roles: ['Admin'], entitlements: entitlements({ planKey: 'pro', billingStatus: 'active' }), now: NOW })
	assert.ok(manual.includes('pakiet płatny Pro\n'), manual)
	// Pakiet kupiony w trakcie triala, potem past_due: trialEndsAt w przyszłości nie może dać „okres próbny”
	const pastDue = buildTeamPlanContext({ locale: 'pl', roles: ['Admin'], entitlements: entitlements({ planKey: 'pro', billingStatus: 'inactive', billingPeriodEnd: '2026-10-10T00:00:00Z', trialEndsAt: '2026-09-25T00:00:00Z' }), now: NOW })
	assert.ok(pastDue.includes('pakiet Pro nieaktywny'), pastDue)
	assert.ok(!pastDue.includes('okres próbny'))
	// Sama data triala bez planKey 'trial' (np. legacy) → stan nieznany
	const dateOnly = buildTeamPlanContext({ locale: 'pl', roles: [], entitlements: entitlements({ trialEndsAt: '2026-09-27T10:00:00Z' }), now: NOW })
	assert.ok(dateOnly.includes('nieznany'))
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

test('miejsca w aplikacji: blok per rola, znaczniki [[LINK:id]] / [[id]] → przyciski, pracownik bez ustawień zespołu', () => {
	const { buildAppLinksBlock, extractAppLinkMarkers, streamVisibleText, appLinksForRoles } = require('../utils/aiHelpPrompt')
	const adminIds = appLinksForRoles(['Admin']).map(l => l.id)
	const workerIds = appLinksForRoles(['Pracownik (Worker)']).map(l => l.id)
	assert.ok(adminIds.includes('settings-holidays') && adminIds.includes('team-management'))
	assert.ok(!workerIds.includes('settings-holidays') && !workerIds.includes('packages'))
	assert.ok(workerIds.includes('leave-request') && workerIds.includes('settings-push'))
	assert.ok(buildAppLinksBlock({ locale: 'pl', roles: ['HR'] }).includes('- settings-leave-types:'))
	assert.ok(!buildAppLinksBlock({ locale: 'pl', roles: ['HR'] }).includes('- team-management:'), 'HR nie zarządza zespołem')

	const r = extractAppLinkMarkers('Kliknij tu.\n\n[[LINK:settings-holidays]]\n[[create-user]]\n[[LINK:packages]]\n[[LINK:nope]]', { locale: 'pl', roles: ['Admin'] })
	assert.equal(r.text, 'Kliknij tu.')
	assert.deepEqual(r.links.map(l => l.id), ['settings-holidays', 'create-user'], 'maks 2, nieznane pomijane')
	assert.equal(r.links[0].path, '/settings#settings-holidays-section')
	const w = extractAppLinkMarkers('Poproś admina. [[LINK:settings-holidays]]', { locale: 'en', roles: ['Pracownik (Worker)'] })
	assert.deepEqual(w.links, [], 'link poza rolą nie staje się przyciskiem')
	assert.equal(w.text, 'Poproś admina.')

	// streaming: zamknięte znaczniki znikają od razu, niezamknięte „[[” wstrzymuje ogon
	assert.equal(streamVisibleText('A [[LINK:x]] B [[LI'), 'A  B ')
	assert.equal(streamVisibleText('bez znaczników'), 'bez znaczników')
	// blok linków jest w części dynamicznej — prefiks statyczny bez zmian
	const a = buildHelpSystemPrompt({ locale: 'pl', roles: ['Admin'] })
	const b = buildHelpSystemPrompt({ locale: 'pl', roles: ['Pracownik (Worker)'] })
	assert.equal(a.staticPrefix, b.staticPrefix)
	assert.ok(a.system.includes('MIEJSCA W APLIKACJI') && a.system.includes('settings-holidays'))
	assert.ok(!b.system.includes('- settings-holidays:'))
})

test('przycisk tylko do miejsca, o którym mówi odpowiedź (appLinks.mention)', () => {
	const { extractAppLinkMarkers } = require('../utils/aiHelpPrompt')
	const off = extractAppLinkMarkers('Święta ustawia Administrator w Ustawieniach.\n[[LINK:settings-push]]', { locale: 'pl', roles: ['Pracownik (Worker)'] })
	assert.deepEqual(off.links, [], 'push bez wzmianki o powiadomieniach — bez przycisku')
	const on = extractAppLinkMarkers('Powiadomienia push włączysz w Ustawieniach.\n[[LINK:settings-push]]', { locale: 'pl', roles: ['Pracownik (Worker)'] })
	assert.deepEqual(on.links.map(l => l.id), ['settings-push'])
	const noMention = extractAppLinkMarkers('Wejdź do ustawień.\n[[LINK:settings-holidays]]', { locale: 'pl', roles: ['Admin'] })
	assert.deepEqual(noMention.links.map(l => l.id), ['settings-holidays'], 'linki bez `mention` zostają')
})
