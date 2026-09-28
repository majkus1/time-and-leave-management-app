const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { planChangeMailLines } = require('../utils/planChangeMail')

const escapeHtml = s =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')

const base = {
	_id: 'team1',
	billingPlanKey: 'base_s',
	billingModuleKeys: ['timer_qr'],
	billingCycle: 'monthly',
	billingPeriodEnd: new Date('2026-11-15T10:00:00Z'),
}
const key = 'zmiana-team1-202611141200-ab12'
const mail = (team, planKey, moduleKeys, billingCycle = 'monthly') =>
	planChangeMailLines({ team, planKey, moduleKeys, billingCycle, idempotencyKey: key, escapeHtml }).join('\n')

describe('planChangeMailLines — mail „Zmiana planu” z danymi do przeniesienia okresu', () => {
	it('Stripe: na sucho → sprawdzenie okresu → unieważnienie faktur → anulowanie bez zwrotu → aktywacja', () => {
		const html = mail({ ...base, stripeSubscriptionId: 'sub_123', stripeSubscriptionStatus: 'active' }, 'base_s', ['timer_qr', 'tasks_chat'])
		const order = ['dryRun', 'sprawdź koniec bieżącego okresu subskrypcji <code>sub_123</code>', 'Unieważnij (Void) otwarte faktury', 'Anuluj subskrypcję <strong>od razu</strong>', 'customer.subscription.deleted', 'Aktywuj: ta sama treść bez']
		const at = order.map(s => html.indexOf(s))
		assert.ok(at.every(i => i >= 0), JSON.stringify(at))
		assert.deepEqual([...at].sort((a, b) => a - b), at, 'kolejność kroków')
		assert.match(html, /bez zwrotu i bez rozliczenia proporcjonalnego/)
		assert.doesNotMatch(html, /Zwrot albo kredyt/)
		// Późniejsza data ze Stripe tylko przy zapłaconym odnowieniu; faktury z zaległością nie unieważniamy bez ustaleń
		assert.match(html, /tylko wtedy, gdy faktura odnowienia jest zapłacona/)
		assert.match(html, /Fakturę z zaległością unieważnij dopiero po ustaleniu z klientem/)
		// Nieaktualny status w bazie — jawne potwierdzenie zamiast samego force
		assert.match(html, /"stripeSubscriptionEnded": true/)
		assert.match(html, /stripeCancelRequired: true<\/code> jest tu oczekiwana/)
		assert.match(html, /Nie zmieniaj planu ani ceny subskrypcji w panelu Stripe/)
	})

	it('treść aktywacji: pełna lista modułów, przeniesiony koniec okresu i klucz jednorazowy', () => {
		const html = mail(base, 'base_s', ['timer_qr', 'tasks_chat'])
		assert.match(html, /&quot;moduleKeys&quot;: \[\s*&quot;timer_qr&quot;,\s*&quot;tasks_chat&quot;\s*\]/)
		assert.match(html, /&quot;periodEnd&quot;: &quot;2026-11-15T10:00:00.000Z&quot;/)
		assert.match(html, /&quot;idempotencyKey&quot;: &quot;zmiana-team1-202611141200-ab12&quot;/)
		assert.doesNotMatch(html, /RRRRMMDD/)
		assert.match(html, /Obecny plan:<\/strong> Core · do 15 osób \+ Timer i QR · miesięcznie · 158 PLN/)
		assert.match(html, /Opłacony do:<\/strong> 15 listopada 2026/)
		assert.match(html, /nowego <code>idempotencyKey<\/code>/)
	})

	it('droższy plan — dopłata za różnicę w obu wersjach (karta i przelew)', () => {
		// Core do 15 + Timer i QR = 158 → PRO do 15 = 189
		for (const team of [base, { ...base, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'active' }]) {
			const html = mail(team, 'pro_15', [])
			assert.match(html, /droższy o 31 PLN/)
			assert.match(html, /Rozlicz dopłatę: 31 PLN netto na każdy miesiąc przeniesionego okresu/)
		}
	})

	it('obecny plan rozliczany rocznie — dopłata stawką roczną (10 × miesiąc na 12), nie miesięczną', () => {
		const html = mail({ ...base, billingCycle: 'annual' }, 'pro_15', [], 'annual')
		assert.match(html, /droższy o 31 PLN netto \/ mies\. wg cennika\. Obecny plan jest rozliczany rocznie \(10 × miesiąc\), więc na miesiąc przeniesionego okresu to 25,83 PLN netto/)
		assert.match(html, /Rozlicz dopłatę: 25,83 PLN netto na każdy miesiąc/)
	})

	it('pakiet jako obecny plan: bez listy funkcji w nazwie i cenie; tańszy plan bez dopłaty', () => {
		const team = { ...base, billingPlanKey: 'pro', billingModuleKeys: ['timer_qr', 'schedules_ai', 'tasks', 'chat', 'ai_assistant'] }
		const html = mail(team, 'base_s', ['timer_qr'])
		assert.match(html, /Obecny plan:<\/strong> PRO · do 30 osób · miesięcznie · 239 PLN/)
		assert.match(html, /tańszy o 81 PLN/)
		assert.doesNotMatch(html, /Rozlicz dopłatę/)
	})

	it('P24 / ręcznie: bez kroków Stripe, z limitem osób nowego planu', () => {
		const html = mail(base, 'pro_15', [], 'annual')
		assert.doesNotMatch(html, /Anuluj subskrypcję|Unieważnij/)
		assert.match(html, /BLIK \/ przelew/)
		assert.match(html, /Nowy plan:<\/strong> PRO · do 15 osób \(klucz pro_15\) · rocznie · 189 PLN/)
		assert.match(html, /limit osób \(nowy plan: do 15 osób\)/)
		assert.match(html, /zgłoszenie jest nieaktualne/)
	})

	it('zaległa płatność kartą: karencja opisana wprost, a w treści aktywacji napis zamiast daty', () => {
		const html = mail({ ...base, stripeSubscriptionId: 'sub_1', stripeSubscriptionStatus: 'past_due' }, 'pro_15', [])
		assert.match(html, /Dostęp do:<\/strong> 15 listopada 2026.*koniec karencji/)
		assert.match(html, /Nie przenoś karencji/)
		assert.match(html, /sprawdź koniec ostatniego opłaconego okresu subskrypcji <code>sub_1<\/code>/)
		assert.doesNotMatch(html, /Jeśli jest późniejszy niż w tym mailu/)
		assert.match(html, /&quot;periodEnd&quot;: &quot;&lt;koniec OSTATNIEGO OPŁACONEGO okresu ze Stripe&gt;&quot;/)
		assert.doesNotMatch(html, /&quot;periodEnd&quot;: &quot;2026-/)
	})

	it('anulowana subskrypcja nie jest traktowana jak żywa', () => {
		const html = mail({ ...base, stripeSubscriptionId: 'sub_old', stripeSubscriptionStatus: 'canceled' }, 'pro_15', undefined)
		assert.doesNotMatch(html, /sub_old/)
	})

	it('stary klucz starter: cena i nazwa jak Core do 15 osób', () => {
		const html = mail(base, 'starter', [])
		assert.match(html, /klucz base_s/)
		assert.match(html, /· 119 PLN netto \/ mies\. wg cennika<\/p>/)
	})

	it('rozliczenie osobne bez daty końca (np. Halo) — w aplikacji nic nie zmieniamy, bez treści aktywacji', () => {
		const html = mail({ ...base, billingPlanKey: 'starter', billingModuleKeys: [], billingStatus: 'active', billingPeriodEnd: null }, 'base_m', [])
		assert.match(html, /brak daty — zespół rozliczany osobno \(np\. fakturą\)/)
		assert.match(html, /w aplikacji niczego nie zmieniaj/)
		assert.match(html, /OPEN_ENDED_BILLING/)
		assert.doesNotMatch(html, /<pre|idempotencyKey|dryRun/)
	})

	it('brak końca okresu (rozliczenie ręczne) — czytelna informacja i napis w treści aktywacji', () => {
		const html = mail({ ...base, billingPeriodEnd: null }, 'pro', undefined)
		assert.match(html, /brak daty — rozliczenie ręczne/)
		assert.match(html, /&quot;periodEnd&quot;: &quot;&lt;koniec opłaconego okresu&gt;&quot;/)
	})
})
