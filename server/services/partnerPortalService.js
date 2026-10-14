const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const Partner = require('../models/Partner')(firmDb)
const Team = require('../models/Team')(firmDb)
const CommissionLedger = require('../models/CommissionLedger')(firmDb)
const entitlementsService = require('./entitlementsService')
const { commissionWindowEnd, isValidMonth, summarizeEntries } = require('../utils/commissionCalc')

const PANEL_ROLES = ['Admin', 'HR']
const LANDING_URL = (process.env.LANDING_PUBLIC_URL || 'https://planopia.pl').replace(/\/$/, '')

function httpError(status, message, code) {
	const err = new Error(message)
	err.status = status
	if (code) err.code = code
	return err
}

/**
 * Partner, którego panel widzi zalogowany użytkownik: jego zespół jest „zespołem partnera” (Partner.partnerTeamId)
 * i ma rolę Admin albo HR. Zakres danych panelu wynika wyłącznie z tego dopasowania — nigdy z parametrów żądania.
 */
async function partnerForUser(user) {
	const roles = Array.isArray(user?.roles) ? user.roles : []
	if (!roles.some(r => PANEL_ROLES.includes(r))) return null
	if (!mongoose.Types.ObjectId.isValid(String(user?.teamId || ''))) return null
	return Partner.findOne({ partnerTeamId: new mongoose.Types.ObjectId(String(user.teamId)) }).lean()
}

async function requirePartner(user) {
	const partner = await partnerForUser(user)
	if (!partner) throw httpError(403, 'Panel partnera jest dostępny dla administratora i HR zespołu partnera', 'NOT_PARTNER')
	return partner
}

/** Stan zespołu poleconego w prostych kategoriach — bez szczegółów rozliczeń firmy */
function teamPlanState(team, now = new Date()) {
	if (team.isActive === false) return 'inactive'
	if (entitlementsService.isTrialActive(team, now)) return 'trial'
	if (entitlementsService.isPaidSubscriptionActive(team, now)) return 'paid'
	return 'free'
}

const sum = (rows, status) => rows.filter(r => r._id.status === status).reduce((s, r) => s + r.sum, 0)

async function overview(user, now = new Date()) {
	const partner = await requirePartner(user)
	const [teams, perTeam, perMonth, totals] = await Promise.all([
		// Bez .lean(): stan planu liczą helpery entitlements, które opierają się na domyślnych wartościach schematu
		Team.find({ referredByPartnerId: partner._id })
			.select('name billingPlanKey billingStatus trialEndsAt billingPeriodEnd billingHadPaidPlan maxUsers isActive stripeSubscriptionId stripeSubscriptionStatus referredAt createdAt')
			.sort({ referredAt: -1 }),
		CommissionLedger.aggregate([{ $match: { partnerId: partner._id } }, { $group: { _id: '$teamId', sum: { $sum: '$commissionGrosze' } } }]),
		CommissionLedger.aggregate([
			{ $match: { partnerId: partner._id } },
			{ $group: { _id: { month: '$month', status: '$status' }, sum: { $sum: '$commissionGrosze' }, base: { $sum: { $cond: [{ $eq: ['$kind', 'accrual'] }, '$baseNetGrosze', 0] } } } },
		]),
		CommissionLedger.aggregate([{ $match: { partnerId: partner._id } }, { $group: { _id: { status: '$status' }, sum: { $sum: '$commissionGrosze' } } }]),
	])
	const teamCommission = new Map(perTeam.map(r => [String(r._id), r.sum]))
	const months = new Map()
	for (const r of perMonth) {
		const m = months.get(r._id.month) || { month: r._id.month, baseNetGrosze: 0, accrued: 0, payable: 0, paid: 0, total: 0 }
		m[r._id.status] += r.sum
		m.total += r.sum
		m.baseNetGrosze += r.base
		months.set(r._id.month, m)
	}
	return {
		partner: {
			name: partner.name,
			code: partner.code,
			link: `${LANDING_URL}/?ref=${partner.code}`,
			commissionRate: partner.commissionRate,
			commissionMonths: partner.commissionMonths ?? null,
			status: partner.status,
		},
		totals: { accrued: sum(totals, 'accrued'), payable: sum(totals, 'payable'), paid: sum(totals, 'paid') },
		months: [...months.values()].sort((a, b) => (a.month < b.month ? 1 : -1)).slice(0, 36),
		teams: teams.map(t => ({
			id: String(t._id),
			name: t.name,
			planState: teamPlanState(t, now),
			referredAt: t.referredAt || t.createdAt,
			commissionUntil: commissionWindowEnd(t.referredAt || t.createdAt, partner.commissionMonths),
			commissionGrosze: teamCommission.get(String(t._id)) || 0,
		})),
	}
}

/** Pozycje prowizji partnera (opcjonalnie z jednego miesiąca) — bez identyfikatorów płatności i notatek wewnętrznych */
async function entries(user, month) {
	const partner = await requirePartner(user)
	const filter = { partnerId: partner._id }
	if (month !== undefined && month !== '') {
		if (!isValidMonth(month)) throw httpError(400, 'Miesiąc w formacie RRRR-MM')
		filter.month = month
	}
	const rows = await CommissionLedger.find(filter).sort({ occurredAt: -1 }).limit(2000).lean()
	// Nazwy firm z wpisów tego partnera — także firmy później przepiętej do innego partnera: to jego historyczne prowizje
	const teams = await Team.find({ _id: { $in: [...new Set(rows.map(e => String(e.teamId)))] } }).select('name').lean()
	const teamName = new Map(teams.map(t => [String(t._id), t.name]))
	return {
		summary: summarizeEntries(rows),
		entries: rows.map(e => ({
			id: String(e._id),
			teamName: teamName.get(String(e.teamId)) || '—',
			sourceType: e.sourceType,
			kind: e.kind,
			baseNetGrosze: e.baseNetGrosze,
			rate: e.rate,
			commissionGrosze: e.commissionGrosze,
			month: e.month,
			occurredAt: e.occurredAt,
			status: e.status,
			paidAt: e.paidAt,
		})),
	}
}

/** Lekkie sprawdzenie dla menu: czy pokazać „Program partnerski” */
async function me(user) {
	const partner = await partnerForUser(user)
	return { isPartner: Boolean(partner) }
}

module.exports = { partnerForUser, overview, entries, me, teamPlanState }
