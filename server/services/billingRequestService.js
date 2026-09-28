const crypto = require('crypto')
const { escapeHtml, getEmailTemplate, sendEmail } = require('./emailService')
const {
	MONTHLY_NET_PRICES_PLN,
	MODULE_MONTHLY_NET_PRICES_PLN,
	AI_ADDON_PACKS,
	normalizePaidPlanKey,
	planLabel,
	moduleLabel,
} = require('../constants/planCatalog')
const { validateBillingPurchaseIntent } = require('./billingPurchaseIntentValidator')
const { planChangeMailLines } = require('../utils/planChangeMail')

const MAX_NOTE_LEN = 2000

function salesInboxEmail() {
	return process.env.BILLING_SALES_EMAIL || process.env.EMAIL_USER || ''
}

const BILLING_ALWAYS_CC = 'michalipka1@gmail.com'

/** Skrzynka z BILLING_SALES_EMAIL / EMAIL_USER + zawsze michalipka1@gmail.com (bez duplikatów). */
function billingSalesRecipients() {
	const primary = (salesInboxEmail() || '').trim()
	const out = []
	if (primary) out.push(primary)
	const lower = new Set(out.map((e) => e.toLowerCase()))
	if (!lower.has(BILLING_ALWAYS_CC.toLowerCase())) out.push(BILLING_ALWAYS_CC)
	if (out.length === 0) {
		const err = new Error('BILLING_SALES_EMAIL / EMAIL_USER is not configured')
		err.code = 'CONFIG'
		throw err
	}
	return out
}

function sanitizeNote(note) {
	if (note == null) return ''
	const s = String(note).trim()
	return s.slice(0, MAX_NOTE_LEN)
}

/**
 * @param {object} params
 * @param {string} params.teamId
 * @param {string} params.requestingUserId
 * @param {'plan'|'addon'} params.kind
 * @param {string} [params.planKey]
 * @param {string} [params.addonId]
 * @param {'monthly'|'annual'} [params.billingCycle]
 * @param {string[]} [params.moduleKeys] moduły do planu Core
 * @param {string} [params.note]
 */
async function createPurchaseMailRequest(params) {
	const to = billingSalesRecipients()

	const { team, requester, planChange } = await validateBillingPurchaseIntent({
		teamId: params.teamId,
		requestingUserId: params.requestingUserId,
		kind: params.kind,
		planKey: params.planKey,
		addonId: params.addonId,
		billingCycle: params.billingCycle,
		moduleKeys: params.moduleKeys,
		channel: 'mail',
	})

	const kind = params.kind
	const note = sanitizeNote(params.note)
	let subject
	let lines

	if (kind === 'plan') {
		// Moduły już zwalidowane (tylko Core, w sprzedaży albo posiadane) — do maila i ceny.
		// Klucz znormalizowany: stary alias „starter” ma cenę i nazwę Core do 15 osób
		const planKey = normalizePaidPlanKey(params.planKey)
		const mods = Array.isArray(params.moduleKeys) ? params.moduleKeys : []
		const what = [planLabel(planKey, 'pl'), ...mods.map(m => moduleLabel(m, 'pl'))].join(' + ')
		subject = planChange
			? `[Planopia] Zmiana planu: ${what} (${params.billingCycle}) — ${team.name}`
			: `[Planopia] Zamówienie: ${what} (${params.billingCycle}) — ${team.name}`
		if (planChange) {
			// Dane do przeniesienia opłaconego okresu i procedura — zła kolejność odbiera klientowi dostęp.
			// Klucz jednorazowy per zgłoszenie: wspólny szablon wklejony drugi raz dawał ciche „duplicate”
			const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
			const idempotencyKey = `zmiana-${team._id}-${stamp}-${crypto.randomBytes(2).toString('hex')}`
			lines = planChangeMailLines({
				team,
				planKey,
				moduleKeys: mods,
				billingCycle: params.billingCycle,
				idempotencyKey,
				escapeHtml,
			})
		} else {
			const price = (MONTHLY_NET_PRICES_PLN[planKey] || 0) + mods.reduce((sum, m) => sum + (MODULE_MONTHLY_NET_PRICES_PLN[m] || 0), 0)
			lines = [
				`<p><strong>Typ:</strong> subskrypcja</p>`,
				`<p><strong>Plan:</strong> ${escapeHtml(what)} (klucz: ${escapeHtml(planKey)}${mods.length ? ', moduły: ' + escapeHtml(mods.join(', ')) : ''})</p>`,
				`<p><strong>Rozliczenie:</strong> ${escapeHtml(params.billingCycle)}</p>`,
				`<p><strong>Cena katalogowa (netto mies.):</strong> ${price} PLN</p>`,
			]
		}
	} else {
		const pack = AI_ADDON_PACKS[params.addonId]
		subject = `[Planopia] Zamówienie: pakiet AI ${params.addonId} — ${team.name}`
		lines = [
			`<p><strong>Typ:</strong> pakiet wiadomości AI</p>`,
			`<p><strong>Pakiet:</strong> ${escapeHtml(params.addonId)} (+${pack.messages} wiadomości)</p>`,
			`<p><strong>Cena katalogowa (netto):</strong> ${pack.pricePlnNet} PLN</p>`,
		]
	}

	const body = [
		planChange ? `<p>Zgłoszenie zmiany planu z aplikacji Planopia.</p>` : `<p>Nowe zgłoszenie zakupu z aplikacji Planopia.</p>`,
		...lines,
		`<p><strong>Zespół:</strong> ${escapeHtml(team.name)} (id: ${escapeHtml(team._id.toString())})</p>`,
		`<p><strong>E-mail admina zespołu:</strong> ${escapeHtml(team.adminEmail || '')}</p>`,
		`<p><strong>Zgłaszający:</strong> ${escapeHtml(requester.firstName || '')} ${escapeHtml(requester.lastName || '')} &lt;${escapeHtml(requester.username)}&gt;</p>`,
		note ? `<p><strong>Wiadomość od klienta:</strong><br/>${escapeHtml(note).replace(/\n/g, '<br/>')}</p>` : '',
		planChange
			? ''
			: `<p><em>Po potwierdzeniu płatności użyj endpointu aktywacji z kluczem BILLING_ADMIN_SECRET (idempotencyKey = unikalny identyfikator płatności; dla Core podaj moduleKeys — pełną listę modułów; najpierw sprawdź na sucho z dryRun: true).</em></p>`,
	].join('')

	const html = getEmailTemplate(
		planChange ? 'Zmiana planu Planopia — obsługa ręczna' : 'Zamówienie Planopia — weryfikacja ręczna',
		body,
		null,
		null,
		null
	)

	await sendEmail(to, 'https://app.planopia.pl', subject, html)

	return { ok: true }
}

module.exports = {
	createPurchaseMailRequest,
	salesInboxEmail,
	billingSalesRecipients,
}
