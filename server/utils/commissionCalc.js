/**
 * Prowizje programu partnerskiego — czyste funkcje (bez bazy, testy w server/tests/commissionCalc.test.js).
 * Kwoty w groszach netto; miesiąc rozliczeniowy liczony w strefie Europe/Warsaw (płatność 31.01 o 23:30 to styczeń).
 */
const moment = require('moment-timezone')
const { isSelfReferral } = require('./referralCode')
const { normalizePaidPlanKey } = require('../constants/planCatalog')

const ZONE = 'Europe/Warsaw'

function toInt(value) {
	const n = Number(value)
	return Number.isFinite(n) ? Math.round(n) : 0
}

/** 'YYYY-MM' w czasie polskim */
function commissionMonth(date) {
	return moment.tz(date, ZONE).format('YYYY-MM')
}

function isValidMonth(month) {
	return typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

/**
 * Koniec okna prowizji (wyłącznie): dzień polecenia + N miesięcy kalendarzowych, liczone w pełnych dniach czasu
 * polskiego — godzina polecenia nie decyduje o fakturze z dnia rocznicy. null = bezterminowo.
 */
function commissionWindowEnd(referredAt, commissionMonths) {
	if (commissionMonths == null) return null
	return moment.tz(referredAt, ZONE).startOf('day').add(commissionMonths, 'months').toDate()
}

/** Ostatni dzień okna prowizji (włącznie) — do wyświetlania; null = bezterminowo */
function commissionLastDay(referredAt, commissionMonths) {
	const end = commissionWindowEnd(referredAt, commissionMonths)
	return end ? moment.tz(end, ZONE).subtract(1, 'day').toDate() : null
}

/** Czy data wypada po dzisiejszym dniu (czas polski) — faktura z jutrzejszą datą to pomyłka */
function isFutureDay(date, now = new Date()) {
	return moment.tz(date, ZONE).format('YYYY-MM-DD') > moment.tz(now, ZONE).format('YYYY-MM-DD')
}

/**
 * Czy i ile prowizji naliczyć od płatności poleconego zespołu.
 * Stawkę i okno bierzemy z partnera w chwili płatności — późniejsza zmiana stawki nie przelicza historii.
 * @returns {{ eligible: boolean, reason?: string, rate?: number, commissionGrosze?: number, month?: string }}
 */
function evaluateCommission({ partner, team, netGrosze, paidAt }) {
	const net = toInt(netGrosze)
	if (!team || !team.referredByPartnerId) return { eligible: false, reason: 'no_partner' }
	if (!partner || String(partner._id) !== String(team.referredByPartnerId)) return { eligible: false, reason: 'no_partner' }
	if (partner.status !== 'active') return { eligible: false, reason: 'partner_paused' }
	if (net <= 0) return { eligible: false, reason: 'zero_amount' }
	if (isSelfReferral({ partner, teamId: team._id, adminEmail: team.adminEmail, nip: team.billingInvoiceNip })) {
		return { eligible: false, reason: 'self_referral' }
	}
	const start = team.referredAt || team.createdAt
	// Płatność sprzed polecenia (np. stara faktura po ręcznym przypięciu zespołu) nie daje prowizji; ten sam dzień — daje
	if (start && moment.tz(paidAt, ZONE).startOf('day').isBefore(moment.tz(start, ZONE).startOf('day'))) {
		return { eligible: false, reason: 'before_referral' }
	}
	const windowEnd = start ? commissionWindowEnd(start, partner.commissionMonths) : null
	if (windowEnd && new Date(paidAt) >= windowEnd) return { eligible: false, reason: 'window_expired' }
	const rate = Number(partner.commissionRate)
	if (!Number.isFinite(rate) || rate <= 0) return { eligible: false, reason: 'zero_rate' }
	const commissionGrosze = Math.round(net * rate)
	if (commissionGrosze <= 0) return { eligible: false, reason: 'zero_amount' }
	return { eligible: true, rate, commissionGrosze, month: commissionMonth(paidAt) }
}

/**
 * Kwota netto opłaconej faktury Stripe. Gdy faktura ma podatek, odcinamy go proporcjonalnie
 * (amount_paid może być mniejsze od total, jeśli część pokrył kredyt klienta).
 */
function stripeInvoiceNetGrosze(invoice) {
	const paid = toInt(invoice?.amount_paid)
	if (paid <= 0) return 0
	const total = toInt(invoice?.total)
	const excl = invoice?.total_excluding_tax
	if (total > 0 && excl != null && Number.isFinite(Number(excl)) && Number(excl) < total) {
		return Math.round((paid * Number(excl)) / total)
	}
	return paid
}

/**
 * Cofnięcie po zwrocie Stripe: zdarzenie niesie łączną zwróconą kwotę ładunku, więc liczymy docelowe łączne
 * cofnięcie i zwracamy tylko brakującą różnicę. Ponowione lub spóźnione zdarzenie da 0 — nic nie cofniemy dwa razy.
 */
function refundReversalDelta({ accrualCommissionGrosze, refundedTotalGrosze, chargeAmountGrosze, alreadyReversedGrosze = 0 }) {
	const commission = toInt(accrualCommissionGrosze)
	const charge = toInt(chargeAmountGrosze)
	if (commission <= 0 || charge <= 0) return 0
	const refunded = Math.min(Math.max(toInt(refundedTotalGrosze), 0), charge)
	const target = Math.round((commission * refunded) / charge)
	const already = Math.max(toInt(alreadyReversedGrosze), 0)
	return Math.max(0, Math.min(target - already, commission - already))
}

/** Ręczne cofnięcie (zwrot P24, korekta faktury): prowizja od zwróconej kwoty netto, najwyżej to, co zostało */
function manualReversalAmount({ accrualCommissionGrosze, rate, refundedNetGrosze, alreadyReversedGrosze = 0 }) {
	const commission = toInt(accrualCommissionGrosze)
	const remaining = commission - Math.max(toInt(alreadyReversedGrosze), 0)
	if (remaining <= 0) return 0
	const wanted = Math.round(Math.max(toInt(refundedNetGrosze), 0) * Number(rate || 0))
	return Math.max(0, Math.min(wanted, remaining))
}

/**
 * Testowa płatność P24 na produkcji (P24_TEST_PRO_PRICE_GROSZE, np. PRO za 1 zł) — bez prowizji.
 * Ten sam warunek co nadpisanie kwoty w planCatalog.p24CheckoutAmountGroszeForPlan.
 */
function isP24TestPayment(session, overrideRaw) {
	if (overrideRaw == null || String(overrideRaw).trim() === '') return false
	const override = parseInt(String(overrideRaw).trim(), 10)
	if (!Number.isFinite(override) || override <= 0) return false
	const modules = Array.isArray(session?.moduleKeys) ? session.moduleKeys : []
	return (
		session?.kind === 'plan' &&
		normalizePaidPlanKey(session.planKey) === 'pro' &&
		session.billingCycle === 'monthly' &&
		modules.length === 0 &&
		Number(session.amountGrosze) === override
	)
}

/** Suma wpisów (prowizje dodatnie, cofnięcia ujemne) w podziale na statusy */
function summarizeEntries(entries = []) {
	const out = { accrued: 0, payable: 0, paid: 0, total: 0, count: 0 }
	for (const e of entries) {
		const amount = toInt(e.commissionGrosze)
		if (out[e.status] !== undefined) out[e.status] += amount
		out.total += amount
		out.count += 1
	}
	return out
}

module.exports = {
	COMMISSION_ZONE: ZONE,
	commissionMonth,
	isValidMonth,
	commissionWindowEnd,
	commissionLastDay,
	evaluateCommission,
	stripeInvoiceNetGrosze,
	refundReversalDelta,
	manualReversalAmount,
	summarizeEntries,
	isP24TestPayment,
	isFutureDay,
}
