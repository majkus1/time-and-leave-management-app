const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const Partner = require('../models/Partner')(firmDb)
const Team = require('../models/Team')(firmDb)
const CommissionLedger = require('../models/CommissionLedger')(firmDb)
const ManualInvoicePayment = require('../models/ManualInvoicePayment')(firmDb)
const BillingPaymentSession = require('../models/BillingPaymentSession')(firmDb)
const {
	commissionMonth,
	isValidMonth,
	evaluateCommission,
	stripeInvoiceNetGrosze,
	refundReversalDelta,
	manualReversalAmount,
	summarizeEntries,
	isP24TestPayment,
	isFutureDay,
} = require('../utils/commissionCalc')

const TEAM_FIELDS = 'name referredByPartnerId referredAt createdAt adminEmail billingInvoiceNip'

function httpError(status, message, code) {
	const err = new Error(message)
	err.status = status
	if (code) err.code = code
	return err
}

function stripeId(value) {
	if (!value) return ''
	return typeof value === 'string' ? value : String(value.id || '')
}

const accrualKey = (sourceType, sourceId) => `${sourceType}:${sourceId}:accrual`

async function loadReferral(teamId) {
	const team = await Team.findById(teamId).select(TEAM_FIELDS).lean()
	if (!team?.referredByPartnerId) return { team, partner: null }
	const partner = await Partner.findById(team.referredByPartnerId).lean()
	return { team, partner }
}

/** Naliczenie od jednej płatności; ta sama płatność drugi raz = duplicate (unikalny idempotencyKey) */
async function accrue({ teamId, sourceType, sourceId, netGrosze, paidGrosze, occurredAt, createdBy, note = '', stripeCustomerId = null }) {
	const { team, partner } = await loadReferral(teamId)
	const evaluation = evaluateCommission({ partner, team, netGrosze, paidAt: occurredAt })
	if (!evaluation.eligible) return { accrued: false, reason: evaluation.reason }
	try {
		const entry = await CommissionLedger.create({
			idempotencyKey: accrualKey(sourceType, sourceId),
			partnerId: partner._id,
			teamId: team._id,
			sourceType,
			sourceId: String(sourceId),
			kind: 'accrual',
			baseNetGrosze: Math.round(Number(netGrosze)),
			paidGrosze: Math.round(Number(paidGrosze ?? netGrosze)),
			rate: evaluation.rate,
			commissionGrosze: evaluation.commissionGrosze,
			month: evaluation.month,
			occurredAt,
			createdBy,
			note,
			stripeCustomerId,
		})
		return { accrued: true, entry }
	} catch (error) {
		if (error?.code === 11000) return { accrued: false, duplicate: true, reason: 'duplicate' }
		throw error
	}
}

/**
 * Cofnięcie z rezerwacją: kwotę liczymy od reversedGrosze naliczenia i zapisujemy nowy stan tylko, jeśli nikt go
 * w międzyczasie nie zmienił (optymistyczna blokada). Gdy wpis cofnięcia się nie utworzy — oddajemy rezerwację.
 */
async function reverseWithReservation(accrualId, computeAmount, build) {
	for (let attempt = 0; attempt < 5; attempt++) {
		const accrual = await CommissionLedger.findById(accrualId).lean()
		if (!accrual || accrual.kind !== 'accrual') return { reversed: false, reason: 'no_accrual' }
		// .lean() pomija default — brak pola = nic jeszcze nie cofnięto
		const already = accrual.reversedGrosze || 0
		const amount = computeAmount(accrual, already)
		if (amount <= 0) return { reversed: false, reason: 'nothing_to_reverse' }
		const guard = already ? { reversedGrosze: already } : { reversedGrosze: { $in: [0, null] } }
		const res = await CommissionLedger.updateOne({ _id: accrual._id, ...guard }, { $set: { reversedGrosze: already + amount } })
		if (res.modifiedCount !== 1) continue
		try {
			const result = await createReversal({ accrual, amountGrosze: amount, ...build(accrual) })
			if (!result.reversed) await CommissionLedger.updateOne({ _id: accrual._id }, { $inc: { reversedGrosze: -amount } })
			return result
		} catch (error) {
			await CommissionLedger.updateOne({ _id: accrual._id }, { $inc: { reversedGrosze: -amount } }).catch(() => {})
			throw error
		}
	}
	throw httpError(409, 'Równoległa zmiana tej prowizji — spróbuj ponownie')
}

async function createReversal({ accrual, idempotencyKey, amountGrosze, refundedNetGrosze = 0, occurredAt, createdBy, note = '' }) {
	try {
		const entry = await CommissionLedger.create({
			idempotencyKey,
			partnerId: accrual.partnerId,
			teamId: accrual.teamId,
			sourceType: accrual.sourceType,
			sourceId: accrual.sourceId,
			kind: 'reversal',
			accrualId: accrual._id,
			baseNetGrosze: Math.round(refundedNetGrosze),
			rate: accrual.rate,
			commissionGrosze: -Math.abs(amountGrosze),
			currency: accrual.currency || 'PLN',
			// Cofnięcie trafia do miesiąca zwrotu — rozliczony miesiąc zostaje nietknięty, różnica schodzi z kolejnej wypłaty
			month: commissionMonth(occurredAt),
			occurredAt,
			createdBy,
			note,
		})
		return { reversed: true, entry }
	} catch (error) {
		if (error?.code === 11000) return { reversed: false, duplicate: true, reason: 'duplicate' }
		throw error
	}
}

/** Stripe invoice.paid — po aktywacji planu. Pierwsza płatność przychodzi też jako checkout, ale liczymy tylko fakturę. */
async function accrueForStripeInvoice({ invoice, teamId }) {
	const currency = String(invoice?.currency || '').toLowerCase()
	if (currency !== 'pln') return { accrued: false, reason: 'currency' }
	const paidAtSec = Number(invoice?.status_transitions?.paid_at)
	return accrue({
		teamId,
		sourceType: 'stripe_invoice',
		sourceId: String(invoice.id),
		netGrosze: stripeInvoiceNetGrosze(invoice),
		paidGrosze: Number(invoice.amount_paid) || 0,
		occurredAt: Number.isFinite(paidAtSec) && paidAtSec > 0 ? new Date(paidAtSec * 1000) : new Date(),
		createdBy: 'stripe',
		stripeCustomerId: stripeId(invoice.customer) || null,
	})
}

/** P24 — po zapisaniu sesji jako opłaconej (kwota sesji jest netto, jak w katalogu) */
async function accrueForP24Session(session, paidAt = new Date()) {
	// Prowizja tylko od planów — dodatki (np. dawne pakiety AI) jej nie dają
	if (session.kind !== 'plan') return { accrued: false, reason: 'not_plan' }
	if (isP24TestPayment(session, process.env.P24_TEST_PRO_PRICE_GROSZE)) return { accrued: false, reason: 'test_payment' }
	return accrue({
		teamId: session.teamId,
		sourceType: 'p24_session',
		sourceId: String(session.sessionId),
		netGrosze: session.amountGrosze,
		paidGrosze: session.amountGrosze,
		occurredAt: paidAt,
		createdBy: 'p24',
		note: session.settlementNote ? `rozliczenie ręczne: ${session.settlementNote}` : '',
	})
}

/** Prowizja nigdy nie blokuje obsługi płatności — błąd tylko w logu (do ręcznego uzupełnienia w panelu) */
async function safeAccrue(label, fn) {
	try {
		const result = await fn()
		if (result?.accrued) console.log(`[partner] prowizja naliczona (${label}): ${result.entry.commissionGrosze} gr`)
		return result
	} catch (error) {
		console.error(`[partner] nie naliczono prowizji (${label}) — sprawdź ręcznie:`, error?.message || error)
		return { accrued: false, reason: 'error' }
	}
}

const safeAccrueForStripeInvoice = args => safeAccrue(`stripe ${args?.invoice?.id}`, () => accrueForStripeInvoice(args))
const safeAccrueForP24Session = (session, paidAt) => safeAccrue(`p24 ${session?.sessionId}`, () => accrueForP24Session(session, paidAt))

/**
 * Stripe charge.refunded: znajdź fakturę ładunku (API 2026: przez invoice_payments), cofnij proporcjonalnie.
 * Zdarzenie niesie łączną zwróconą kwotę, więc ponowienia i kolejne zwroty częściowe dokładają tylko różnicę.
 */
async function reverseForStripeRefund({ charge, stripe }) {
	if (String(charge?.currency || '').toLowerCase() !== 'pln') return { reversed: false, reason: 'currency' }
	const paymentIntentId = stripeId(charge.payment_intent)
	if (!paymentIntentId) return { reversed: false, reason: 'no_payment_intent' }
	const payments = await stripe.invoicePayments.list({ payment: { type: 'payment_intent', payment_intent: paymentIntentId }, limit: 1 })
	const invoiceId = stripeId(payments?.data?.[0]?.invoice)
	if (!invoiceId) return { reversed: false, reason: 'no_invoice' }
	const found = await CommissionLedger.findOne({ idempotencyKey: accrualKey('stripe_invoice', invoiceId) }).select('_id').lean()
	if (!found) return { reversed: false, reason: 'no_accrual' }
	return reverseWithReservation(
		found._id,
		(accrual, already) =>
			refundReversalDelta({
				accrualCommissionGrosze: accrual.commissionGrosze,
				refundedTotalGrosze: charge.amount_refunded,
				chargeAmountGrosze: charge.amount,
				alreadyReversedGrosze: already,
			}),
		accrual => ({
			idempotencyKey: `stripe_invoice:${invoiceId}:reversal:${charge.id}:${charge.amount_refunded}`,
			refundedNetGrosze: Math.round((accrual.baseNetGrosze * Number(charge.amount_refunded)) / Number(charge.amount)),
			occurredAt: new Date(),
			createdBy: 'stripe',
			note: `zwrot Stripe ${charge.id}`,
		})
	)
}

/**
 * Wersja dla webhooka: zwrot u zespołu bez prowizji (większość) nie pyta Stripe o fakturę, a błąd prowizji nigdy nie daje
 * 500 — inaczej Stripe ponawiałby zdarzenie i przy trwałym błędzie mógł wyłączyć cały endpoint (także invoice.paid).
 */
async function safeReverseForStripeRefund({ charge, stripe }) {
	try {
		// Szybkie odrzucenie zwrotów bez prowizji (większość) bez pytania Stripe: po kliencie Stripe zapisanym przy
		// naliczeniu — nie po bieżącym kliencie zespołu, bo nowy zakup kartą tworzy nowego klienta
		const customerId = stripeId(charge?.customer)
		if (!customerId || !(await CommissionLedger.exists({ stripeCustomerId: customerId, sourceType: 'stripe_invoice', kind: 'accrual' }))) {
			return { reversed: false, reason: 'no_accrual' }
		}
		const result = await reverseForStripeRefund({ charge, stripe })
		if (result.reversed) console.log(`[partner] prowizja cofnięta (zwrot ${charge.id}): ${result.entry.commissionGrosze} gr`)
		return result
	} catch (error) {
		console.error(`[partner] nie cofnięto prowizji po zwrocie ${charge?.id} — cofnij ręcznie w panelu partnerów:`, error?.message || error)
		return { reversed: false, reason: 'error' }
	}
}

// ——— panel admina platformy ———

function parseGrosze(value, label) {
	const n = Math.round(Number(String(value ?? '').replace(',', '.')))
	if (!Number.isFinite(n) || n <= 0) throw httpError(400, `${label}: podaj kwotę większą od zera`)
	return n
}

function parseDate(value, label) {
	const d = value ? new Date(value) : null
	if (!d || Number.isNaN(d.getTime())) throw httpError(400, `${label}: nieprawidłowa data`)
	if (isFutureDay(d)) throw httpError(400, `${label}: data z przyszłości`)
	return d
}

function requireMonth(month) {
	if (!isValidMonth(month)) throw httpError(400, 'Miesiąc w formacie RRRR-MM')
	return month
}

const REASON_TEXT = {
	no_partner: 'Zespół nie jest przypisany do partnera',
	partner_paused: 'Partner jest wstrzymany',
	window_expired: 'Minął okres naliczania prowizji dla tego zespołu',
	before_referral: 'Płatność sprzed przypisania zespołu do partnera — prowizja się nie należy',
	self_referral: 'To firma samego partnera (ten sam NIP, e-mail albo zespół)',
	zero_amount: 'Kwota prowizji wynosi 0',
	zero_rate: 'Partner ma stawkę 0%',
}

/** Faktura poza aplikacją → zapis + naliczenie. Gdy prowizja się nie należy, nic nie zapisujemy i mówimy dlaczego. */
async function recordManualInvoice({ teamId, invoiceNumber, netGrosze, paidAt, note = '', userId }) {
	if (!mongoose.Types.ObjectId.isValid(String(teamId))) throw httpError(404, 'Zespół nie istnieje')
	const number = String(invoiceNumber ?? '').trim()
	if (!number || number.length > 100) throw httpError(400, 'Podaj numer faktury')
	const net = parseGrosze(netGrosze, 'Kwota netto')
	const paid = parseDate(paidAt, 'Data zapłaty')
	const { team, partner } = await loadReferral(teamId)
	if (!team) throw httpError(404, 'Zespół nie istnieje')
	const check = evaluateCommission({ partner, team, netGrosze: net, paidAt: paid })
	if (!check.eligible) throw httpError(400, REASON_TEXT[check.reason] || 'Prowizja się nie należy', check.reason.toUpperCase())
	let invoice
	try {
		invoice = await ManualInvoicePayment.create({ teamId: team._id, invoiceNumber: number, netGrosze: net, paidAt: paid, note: String(note || '').slice(0, 500), createdBy: String(userId || '') })
	} catch (error) {
		if (error?.code === 11000) throw httpError(409, 'Ta faktura jest już wpisana dla tego zespołu', 'DUPLICATE')
		throw error
	}
	try {
		const result = await accrue({
			teamId: team._id,
			sourceType: 'manual_invoice',
			sourceId: String(invoice._id),
			netGrosze: net,
			paidGrosze: net,
			occurredAt: paid,
			createdBy: String(userId || ''),
			note: `faktura ${number}`,
		})
		if (!result.accrued) throw httpError(400, REASON_TEXT[result.reason] || 'Nie naliczono prowizji')
		return { invoice: invoice.toObject(), entry: result.entry.toObject() }
	} catch (error) {
		// Bez prowizji faktura w tym rejestrze nie ma sensu — wycofujemy zapis, żeby dało się wpisać ją ponownie
		await ManualInvoicePayment.deleteOne({ _id: invoice._id }).catch(() => {})
		throw error
	}
}

/**
 * Doliczenie prowizji, której automat nie naliczył (błąd zapisu przy webhooku). Liczymy dokładnie tak jak automat
 * i z tym samym kluczem — powtórzenie albo spóźniony webhook nie dadzą drugiej prowizji, a zwrot Stripe ją znajdzie.
 * stripe: klient Stripe (tylko dla faktur Stripe).
 */
async function retryAccrual({ sourceType, sourceId, stripe }) {
	const id = typeof sourceId === 'string' ? sourceId.trim() : ''
	if (!/^[A-Za-z0-9_.-]{3,100}$/.test(id)) throw httpError(400, 'Podaj id faktury Stripe (in_…) albo sesji P24')
	let result
	if (sourceType === 'p24_session') {
		const session = await BillingPaymentSession.findOne({ sessionId: id }).lean()
		if (!session) throw httpError(404, 'Nie ma takiej sesji P24')
		if (session.status !== 'paid') throw httpError(400, 'Ta sesja P24 nie jest opłacona')
		result = await accrueForP24Session(session, session.updatedAt || new Date())
	} else if (sourceType === 'stripe_invoice') {
		if (!stripe) throw httpError(503, 'Stripe nie jest skonfigurowany')
		let invoice
		try {
			invoice = await stripe.invoices.retrieve(id)
		} catch {
			throw httpError(404, 'Stripe nie zna takiej faktury')
		}
		if (invoice.status !== 'paid') throw httpError(400, 'Ta faktura Stripe nie jest opłacona')
		const customerId = stripeId(invoice.customer)
		const team = customerId ? await Team.findOne({ stripeCustomerId: customerId }).select('_id').lean() : null
		if (!team) throw httpError(404, 'Żaden zespół nie ma tego klienta Stripe')
		result = await accrueForStripeInvoice({ invoice, teamId: team._id })
	} else {
		throw httpError(400, 'Źródło: stripe_invoice albo p24_session')
	}
	if (result.duplicate) throw httpError(409, 'Prowizja od tej płatności jest już naliczona', 'DUPLICATE')
	if (!result.accrued) {
		const text = { test_payment: 'To płatność testowa P24 — bez prowizji', currency: 'Płatność nie jest w złotówkach', not_plan: 'Prowizja należy się tylko od planów' }
		throw httpError(400, REASON_TEXT[result.reason] || text[result.reason] || 'Prowizja się nie należy', String(result.reason || '').toUpperCase())
	}
	return { entry: result.entry.toObject() }
}

/** Ręczne cofnięcie naliczenia (zwrot P24, korekta faktury). nonce z formularza chroni przed podwójnym kliknięciem. */
async function reverseManually({ entryId, refundedNetGrosze, nonce, note = '', userId }) {
	if (!mongoose.Types.ObjectId.isValid(String(entryId))) throw httpError(404, 'Wpis nie istnieje')
	if (typeof nonce !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(nonce)) throw httpError(400, 'Brak identyfikatora operacji — odśwież stronę')
	const refunded = parseGrosze(refundedNetGrosze, 'Zwrócona kwota netto')
	const result = await reverseWithReservation(
		entryId,
		(accrual, already) =>
			manualReversalAmount({ accrualCommissionGrosze: accrual.commissionGrosze, rate: accrual.rate, refundedNetGrosze: refunded, alreadyReversedGrosze: already }),
		accrual => ({
			idempotencyKey: `${accrual.sourceType}:${accrual.sourceId}:reversal:manual:${nonce}`,
			// Zwrot ponad płatność zapisujemy jako całą płatność — w historii nie może wisieć wpisana omyłkowo kwota
			refundedNetGrosze: Math.min(refunded, accrual.baseNetGrosze || refunded),
			occurredAt: new Date(),
			createdBy: String(userId || ''),
			note: String(note || '').slice(0, 500) || 'cofnięcie ręczne',
		})
	)
	if (result.reason === 'no_accrual') throw httpError(404, 'Wpis nie istnieje')
	if (result.reason === 'nothing_to_reverse') throw httpError(400, 'Ta prowizja jest już w całości cofnięta')
	return { duplicate: result.duplicate === true, entry: result.entry ? result.entry.toObject() : null }
}

/** Raport miesiąca: na partnera — prowizje miesiąca wg statusu oraz łącznie do wypłaty i jeszcze niezamknięte */
async function monthReport(month) {
	requireMonth(month)
	const [partners, monthRows, openRows] = await Promise.all([
		Partner.find({}).select('name code status commissionRate').sort({ name: 1 }).lean(),
		CommissionLedger.aggregate([
			{ $match: { month } },
			{ $group: { _id: { partnerId: '$partnerId', status: '$status' }, sum: { $sum: '$commissionGrosze' }, base: { $sum: { $cond: [{ $eq: ['$kind', 'accrual'] }, '$baseNetGrosze', 0] } }, n: { $sum: 1 } } },
		]),
		CommissionLedger.aggregate([
			{ $match: { status: { $in: ['accrued', 'payable'] } } },
			{ $group: { _id: { partnerId: '$partnerId', status: '$status' }, sum: { $sum: '$commissionGrosze' } } },
		]),
	])
	const rows = partners.map(p => ({
		partnerId: String(p._id),
		name: p.name,
		code: p.code,
		status: p.status,
		month: { baseNetGrosze: 0, accrued: 0, payable: 0, paid: 0, total: 0, count: 0 },
		openAccruedGrosze: 0,
		payableGrosze: 0,
	}))
	const byId = new Map(rows.map(r => [r.partnerId, r]))
	for (const r of monthRows) {
		const row = byId.get(String(r._id.partnerId))
		if (!row) continue
		row.month[r._id.status] += r.sum
		row.month.total += r.sum
		row.month.baseNetGrosze += r.base
		row.month.count += r.n
	}
	for (const r of openRows) {
		const row = byId.get(String(r._id.partnerId))
		if (!row) continue
		if (r._id.status === 'payable') row.payableGrosze += r.sum
		else row.openAccruedGrosze += r.sum
	}
	return { month, partners: rows.filter(r => r.month.count > 0 || r.payableGrosze !== 0 || r.openAccruedGrosze !== 0) }
}

async function listEntries({ partnerId, month }) {
	const filter = {}
	if (partnerId !== undefined) {
		if (!mongoose.Types.ObjectId.isValid(String(partnerId))) throw httpError(404, 'Partner nie istnieje')
		filter.partnerId = new mongoose.Types.ObjectId(String(partnerId))
	}
	if (month !== undefined && month !== '') filter.month = requireMonth(month)
	const entries = await CommissionLedger.find(filter).sort({ occurredAt: -1 }).limit(1000).lean()
	const teams = await Team.find({ _id: { $in: [...new Set(entries.map(e => String(e.teamId)))] } }).select('name').lean()
	const teamName = new Map(teams.map(t => [String(t._id), t.name]))
	return {
		summary: summarizeEntries(entries),
		entries: entries.map(e => ({
			id: String(e._id),
			partnerId: String(e.partnerId),
			teamId: String(e.teamId),
			teamName: teamName.get(String(e.teamId)) || '—',
			sourceType: e.sourceType,
			sourceId: e.sourceId,
			kind: e.kind,
			accrualId: e.accrualId ? String(e.accrualId) : null,
			baseNetGrosze: e.baseNetGrosze,
			rate: e.rate,
			commissionGrosze: e.commissionGrosze,
			month: e.month,
			occurredAt: e.occurredAt,
			status: e.status,
			paidAt: e.paidAt,
			payoutNote: e.payoutNote || '',
			note: e.note || '',
		})),
	}
}

/** Zamknięcie miesiąca: naliczone do tego miesiąca włącznie → do wypłaty. Miesiąca z przyszłości nie zamykamy. */
async function closeMonth(month, now = new Date()) {
	requireMonth(month)
	if (month > commissionMonth(now)) throw httpError(400, 'Nie można zamknąć miesiąca, który jeszcze się nie zaczął')
	const res = await CommissionLedger.updateMany({ status: 'accrued', month: { $lte: month } }, { $set: { status: 'payable', payableAt: now } })
	return { month, updated: res.modifiedCount || 0 }
}

/** Wypłata partnerowi: wszystkie wpisy „do wypłaty” → wypłacone (z datą i notatką, np. nr faktury partnera) */
async function markPaid({ partnerId, paidAt, note = '' }) {
	if (!mongoose.Types.ObjectId.isValid(String(partnerId))) throw httpError(404, 'Partner nie istnieje')
	const when = parseDate(paidAt, 'Data wypłaty')
	const pid = new mongoose.Types.ObjectId(String(partnerId))
	const ids = await CommissionLedger.find({ partnerId: pid, status: 'payable' }).select('_id commissionGrosze').lean()
	if (!ids.length) throw httpError(400, 'Partner nie ma nic do wypłaty — najpierw zamknij miesiąc')
	// Ujemne saldo (cofnięcia po wypłacie) to dług partnera — zostaje „do wypłaty” i pomniejszy kolejną wypłatę
	if (ids.reduce((s, e) => s + e.commissionGrosze, 0) <= 0) {
		throw httpError(400, 'Saldo partnera jest ujemne albo zerowe — potrąci się z kolejnych prowizji', 'NEGATIVE_BALANCE')
	}
	// Tylko wpisy policzone wyżej — gdy w międzyczasie ktoś zamknie kolejny miesiąc, nie oznaczymy ich bez sprawdzenia
	const res = await CommissionLedger.updateMany(
		{ _id: { $in: ids.map(e => e._id) }, status: 'payable' },
		{ $set: { status: 'paid', paidAt: when, payoutNote: String(note || '').slice(0, 500) } }
	)
	return { updated: res.modifiedCount || 0, amountGrosze: ids.reduce((s, e) => s + e.commissionGrosze, 0) }
}

async function listManualInvoices() {
	const invoices = await ManualInvoicePayment.find({}).sort({ paidAt: -1 }).limit(200).lean()
	const teams = await Team.find({ _id: { $in: [...new Set(invoices.map(i => String(i.teamId)))] } }).select('name').lean()
	const teamName = new Map(teams.map(t => [String(t._id), t.name]))
	return invoices.map(i => ({
		id: String(i._id),
		teamId: String(i.teamId),
		teamName: teamName.get(String(i.teamId)) || '—',
		invoiceNumber: i.invoiceNumber,
		netGrosze: i.netGrosze,
		paidAt: i.paidAt,
		note: i.note || '',
	}))
}

module.exports = {
	accrue,
	accrueForStripeInvoice,
	accrueForP24Session,
	safeAccrueForStripeInvoice,
	safeAccrueForP24Session,
	reverseForStripeRefund,
	safeReverseForStripeRefund,
	retryAccrual,
	recordManualInvoice,
	reverseManually,
	monthReport,
	listEntries,
	closeMonth,
	markPaid,
	listManualInvoices,
}
