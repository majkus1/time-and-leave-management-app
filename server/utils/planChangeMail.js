/**
 * Mail „Zmiana planu” (zgłoszenie przy opłaconym okresie): dane do przeniesienia okresu, różnica w cenie i procedura.
 *
 * Procedura, bo zła kolejność albo nieaktualna data odbiera klientowi opłacony dostęp:
 *  - najpierw sprawdzenie na sucho (plan, moduły, limit osób, data, klucz, zaległość) — zanim cokolwiek zostanie anulowane;
 *  - Stripe: unieważnienie otwartych faktur (zapłacona później przywróciłaby stary plan), anulowanie od razu bez zwrotu
 *    (okres przenosimy), aktywacja po customer.subscription.deleted — endpoint i tak odmówi przy działającej subskrypcji;
 *  - data z maila to punkt wyjścia: odnowienie albo nowy zakup po zgłoszeniu ją dezaktualizuje, a późniejsza data
 *    ze Stripe liczy się tylko przy zapłaconym odnowieniu;
 *  - karencja po nieudanej płatności to nie opłacony okres — zamiast daty napis, na którym aktywacja się zatrzyma;
 *  - zespół rozliczany osobno bez daty końca (np. fakturą) — w aplikacji nic nie zmieniamy;
 *  - klucz jednorazowy per zgłoszenie — powtórzony endpoint odrzuca (409).
 * Czysta funkcja — escapeHtml i klucz wstrzykuje wywołujący (emailService ładuje bazę).
 */
const {
	PAID_PLANS,
	ANNUAL_NET_MONTHS_CHARGED,
	normalizePaidPlanKey,
	isCorePlanKey,
	planLabel,
	moduleLabel,
	MONTHLY_NET_PRICES_PLN,
	MODULE_MONTHLY_NET_PRICES_PLN,
} = require('../constants/planCatalog')
const { LIVE_STRIPE_SUBSCRIPTION_STATUSES, PAST_DUE_STRIPE_STATUSES, hasOpenEndedBilling } = require('./billingPlanChange')

const warsawDate = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'long', timeStyle: 'short' })
const plnAmount = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })
const ENDPOINT =
	'<code>POST /api/billing/internal/activate-subscription</code> z nagłówkiem <code>X-Billing-Admin-Secret</code>'

function cycleLabel(cycle) {
	if (cycle === 'annual') return 'rocznie'
	if (cycle === 'monthly') return 'miesięcznie'
	return 'nieznany cykl'
}

/** Moduły liczą się tylko przy Core — pakiety mają w billingModuleKeys wszystkie funkcje, w cenie */
function coreModules(planKey, moduleKeys) {
	return isCorePlanKey(planKey) && Array.isArray(moduleKeys) ? moduleKeys : []
}

function monthlyPrice(planKey, moduleKeys) {
	const mods = coreModules(planKey, moduleKeys)
	return (MONTHLY_NET_PRICES_PLN[planKey] || 0) + mods.reduce((sum, m) => sum + (MODULE_MONTHLY_NET_PRICES_PLN[m] || 0), 0)
}

function planWithModules(planKey, moduleKeys) {
	return [planLabel(planKey, 'pl'), ...coreModules(planKey, moduleKeys).map(m => moduleLabel(m, 'pl'))].join(' + ')
}

/**
 * Różnica na miesiąc przeniesionego okresu. Okres opłacono w obecnym cyklu — przy rocznym (10 × miesiąc) liczymy
 * stawką roczną rozłożoną na 12 miesięcy, inaczej dopłata wyszłaby o 20% za wysoka.
 */
function perMonthDifference(diff, currentCycle) {
	return currentCycle === 'annual' ? (diff * ANNUAL_NET_MONTHS_CHARGED) / 12 : diff
}

function differenceLine(diff, perMonth, annual) {
	if (diff === 0) return 'ta sama cena katalogowa — bez dopłaty.'
	const rate = annual
		? ` Obecny plan jest rozliczany rocznie (${ANNUAL_NET_MONTHS_CHARGED} × miesiąc), więc na miesiąc przeniesionego okresu to ${plnAmount.format(Math.abs(perMonth))} PLN netto.`
		: ''
	return diff > 0
		? `nowy plan jest droższy o ${diff} PLN netto / mies. wg cennika.${rate} Za przeniesiony okres dolicz różnicę fakturą albo płatnością.`
		: `nowy plan jest tańszy o ${-diff} PLN netto / mies. wg cennika.${rate} Opłacony okres przenosisz bez zmian; zwrot różnicy tylko po ustaleniu z klientem, osobno.`
}

/**
 * @param {{ team: object, planKey: string, moduleKeys?: string[], billingCycle: string, idempotencyKey: string, escapeHtml: (s: string) => string }} p
 * @returns {string[]} linie HTML treści maila
 */
function planChangeMailLines({ team, planKey, moduleKeys, billingCycle, idempotencyKey, escapeHtml }) {
	const nk = normalizePaidPlanKey(planKey)
	const mods = coreModules(nk, moduleKeys)
	const newPrice = monthlyPrice(nk, mods)
	const maxUsers = PAID_PLANS[nk]?.maxUsers

	const currentKey = normalizePaidPlanKey(team.billingPlanKey)
	const currentMods = coreModules(currentKey, team.billingModuleKeys)
	const diff = newPrice - monthlyPrice(currentKey, currentMods)
	const annual = team.billingCycle === 'annual'
	const perMonth = perMonthDifference(diff, team.billingCycle)

	const status = team.stripeSubscriptionStatus
	const liveStripe = Boolean(team.stripeSubscriptionId) && LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(status)
	const pastDue = liveStripe && PAST_DUE_STRIPE_STATUSES.has(status)
	const openEnded = !liveStripe && hasOpenEndedBilling(team)
	const end = team.billingPeriodEnd ? new Date(team.billingPeriodEnd) : null
	const endValid = Boolean(end) && !Number.isNaN(end.getTime())

	let paidUntil = 'brak daty — rozliczenie ręczne'
	if (endValid) paidUntil = `${escapeHtml(warsawDate.format(end))} (${escapeHtml(end.toISOString())})`
	else if (openEnded) paidUntil = 'brak daty — zespół rozliczany osobno (np. fakturą)'

	const dataLines = [
		'<p><strong>Typ:</strong> zmiana planu przy aktywnym planie — nie pobieraj drugiej płatności obok działającej, przenieś opłacony okres.</p>',
		`<p><strong>Obecny plan:</strong> ${escapeHtml(planWithModules(currentKey, currentMods))} · ${cycleLabel(team.billingCycle)} · ${monthlyPrice(currentKey, currentMods)} PLN netto / mies. wg cennika</p>`,
		`<p><strong>${pastDue ? 'Dostęp do' : 'Opłacony do'}:</strong> ${paidUntil}${
			pastDue ? ' — to koniec karencji po nieudanej płatności, nie opłaconego okresu' : ''
		}</p>`,
		`<p><strong>Płatność obecnego planu:</strong> ${
			liveStripe
				? `karta — subskrypcja Stripe <code>${escapeHtml(team.stripeSubscriptionId)}</code> (${escapeHtml(status)})`
				: 'BLIK / przelew (Przelewy24) albo rozliczenie ręczne'
		}</p>`,
		`<p><strong>Nowy plan:</strong> ${escapeHtml(planWithModules(nk, mods))} (klucz ${escapeHtml(nk)}${
			mods.length ? `, moduły: ${escapeHtml(mods.join(', '))}` : ''
		}) · ${cycleLabel(billingCycle)} · ${newPrice} PLN netto / mies. wg cennika</p>`,
		`<p><strong>Różnica:</strong> ${differenceLine(diff, perMonth, annual)}</p>`,
	]

	// Rozliczenie osobne bez daty końca: aktywacja nadałaby datę, a po niej odcięła dostęp — w aplikacji nic nie zmieniamy
	if (openEnded) {
		return [
			...dataLines,
			'<p><strong>Jak obsłużyć:</strong> zespół rozliczany osobno, bez daty końca — w aplikacji niczego nie zmieniaj: aktywacja nadałaby datę końca, a po niej odcięła dostęp (endpoint odmówi: <code>OPEN_ENDED_BILLING</code>). Zmianę ustal z klientem.</p>',
		]
	}

	let periodEnd = '<koniec opłaconego okresu>'
	if (pastDue) periodEnd = '<koniec OSTATNIEGO OPŁACONEGO okresu ze Stripe>'
	else if (endValid) periodEnd = end.toISOString()

	const activation = {
		teamId: String(team._id),
		planKey: nk,
		billingCycle,
		moduleKeys: mods,
		periodEnd,
		idempotencyKey,
	}

	const dryRunStep = `Sprawdź na sucho: ${ENDPOINT}, treść poniżej i dodatkowo <code>"dryRun": true</code>. Sprawdza plan, moduły, limit osób (nowy plan: do ${maxUsers} osób), datę, klucz i zaległości w Stripe — niczego nie zapisuje.`
	const payStep =
		diff > 0
			? `Rozlicz dopłatę: ${plnAmount.format(perMonth)} PLN netto na każdy miesiąc przeniesionego okresu, proporcjonalnie do pozostałego czasu (faktura albo płatność).`
			: null
	const subCode = `<code>${escapeHtml(team.stripeSubscriptionId)}</code>`
	const steps = liveStripe
		? [
				`${dryRunStep} Odpowiedź <code>stripeCancelRequired: true</code> jest tu oczekiwana.`,
				pastDue
					? `W panelu Stripe sprawdź koniec ostatniego opłaconego okresu subskrypcji ${subCode} (ostatnia zapłacona faktura) i wpisz go w <code>periodEnd</code>.`
					: `W panelu Stripe sprawdź koniec bieżącego okresu subskrypcji ${subCode}. Jeśli jest późniejszy niż w tym mailu (odnowienie po zgłoszeniu), wpisz go w <code>periodEnd</code> tylko wtedy, gdy faktura odnowienia jest zapłacona — niezapłacona to zaległość (sprawdzenie na sucho zgłosi <code>STRIPE_PAYMENT_PAST_DUE</code>).`,
				'Unieważnij (Void) otwarte faktury tej subskrypcji — zapłacona po zmianie przywróciłaby stary plan. Fakturę z zaległością unieważnij dopiero po ustaleniu z klientem, jak ją rozliczyć.',
				'Anuluj subskrypcję <strong>od razu</strong> (nie „na koniec okresu”), bez zwrotu i bez rozliczenia proporcjonalnego — niewykorzystany okres przenosisz na nowy plan. Jeśli w Stripe jest już anulowana (w bazie nieaktualny status), pomiń ten i następny krok, a do treści dodaj <code>"stripeSubscriptionEnded": true</code>.',
				'Poczekaj na zdarzenie <code>customer.subscription.deleted</code> — do tego czasu endpoint odmówi aktywacji. Między anulowaniem a aktywacją zespół nie ma dostępu, więc zrób to od razu.',
				'Aktywuj: ta sama treść bez <code>dryRun</code>. Stara subskrypcja zostanie odpięta i zespół przejdzie na rozliczenie ręczne — bez odnowienia kartą; przed końcem okresu aplikacja wyśle przypomnienie, a płatność online w Pakietach odblokuje się po jego końcu.',
				payStep,
				'Nie zmieniaj planu ani ceny subskrypcji w panelu Stripe zamiast tej procedury — metadane planu zostałyby stare, a odnowienia kończyłyby się błędem.',
			]
		: [
				dryRunStep,
				'Sprawdź w bazie aktualny koniec opłaconego okresu. Jeśli różni się od tego maila (np. zespół w międzyczasie opłacił nowy okres), zgłoszenie jest nieaktualne — ustal z klientem, co zmienić.',
				payStep,
				'Aktywuj: ta sama treść bez <code>dryRun</code>.',
			]

	return [
		...dataLines,
		pastDue
			? `<p><strong>Uwaga:</strong> płatność kartą jest zaległa (${escapeHtml(status)}). Nie przenoś karencji — ustal z klientem zaległość; jeśli opłacony okres już minął, to nowy zakup, a nie przeniesienie. W <code>periodEnd</code> wpisz koniec ostatniego opłaconego okresu ze Stripe. Sprawdzenie na sucho zgłosi <code>STRIPE_PAYMENT_PAST_DUE</code> — <code>force: true</code> dopiero po rozliczeniu zaległości.</p>`
			: '',
		'<p><strong>Jak obsłużyć:</strong></p>',
		`<ol>${steps
			.filter(Boolean)
			.map(s => `<li>${s}</li>`)
			.join('')}</ol>`,
		`<pre style="background:#f1f5f9;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(JSON.stringify(activation, null, 2))}</pre>`,
		'<p>Przy poprawce albo kolejnej zmianie użyj nowego <code>idempotencyKey</code> (np. dopisz -2) — powtórzonego endpoint nie wykona (409).</p>',
	].filter(Boolean)
}

module.exports = { planChangeMailLines }
