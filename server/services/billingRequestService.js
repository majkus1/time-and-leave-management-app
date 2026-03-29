const { escapeHtml, getEmailTemplate, sendEmail } = require('./emailService')
const {
	MONTHLY_NET_PRICES_PLN,
	AI_ADDON_PACKS,
} = require('../constants/planCatalog')
const { validateBillingPurchaseIntent } = require('./billingPurchaseIntentValidator')

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
 * @param {string} [params.note]
 */
async function createPurchaseMailRequest(params) {
	const to = billingSalesRecipients()

	const { team, requester } = await validateBillingPurchaseIntent({
		teamId: params.teamId,
		requestingUserId: params.requestingUserId,
		kind: params.kind,
		planKey: params.planKey,
		addonId: params.addonId,
		billingCycle: params.billingCycle,
	})

	const kind = params.kind
	const note = sanitizeNote(params.note)
	let subject
	let lines

	if (kind === 'plan') {
		const price = MONTHLY_NET_PRICES_PLN[params.planKey]
		subject = `[Planopia] Zamówienie: plan ${params.planKey} (${params.billingCycle}) — ${team.name}`
		lines = [
			`<p><strong>Typ:</strong> subskrypcja</p>`,
			`<p><strong>Plan:</strong> ${escapeHtml(params.planKey)}</p>`,
			`<p><strong>Rozliczenie:</strong> ${escapeHtml(params.billingCycle)}</p>`,
			`<p><strong>Cena katalogowa (netto mies.):</strong> ${price} PLN</p>`,
		]
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
		`<p>Nowe zgłoszenie zakupu z aplikacji Planopia.</p>`,
		...lines,
		`<p><strong>Zespół:</strong> ${escapeHtml(team.name)} (id: ${escapeHtml(team._id.toString())})</p>`,
		`<p><strong>E-mail admina zespołu:</strong> ${escapeHtml(team.adminEmail || '')}</p>`,
		`<p><strong>Zgłaszający:</strong> ${escapeHtml(requester.firstName || '')} ${escapeHtml(requester.lastName || '')} &lt;${escapeHtml(requester.username)}&gt;</p>`,
		note ? `<p><strong>Wiadomość od klienta:</strong><br/>${escapeHtml(note).replace(/\n/g, '<br/>')}</p>` : '',
		`<p><em>Po potwierdzeniu płatności użyj endpointu aktywacji z kluczem BILLING_ADMIN_SECRET (idempotencyKey = unikalny identyfikator płatności).</em></p>`,
	].join('')

	const html = getEmailTemplate('Zamówienie Planopia — weryfikacja ręczna', body, null, null, null)

	await sendEmail(to, 'https://app.planopia.pl', subject, html)

	return { ok: true }
}

module.exports = {
	createPurchaseMailRequest,
	salesInboxEmail,
	billingSalesRecipients,
}
