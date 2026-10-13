const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const Partner = require('../models/Partner')(firmDb)
const Team = require('../models/Team')(firmDb)
const { normalizeReferralCode, isSelfReferral, canReceiveReferrals } = require('../utils/referralCode')

function httpError(status, message, code) {
	const err = new Error(message)
	err.status = status
	if (code) err.code = code
	return err
}

function escapeRegex(text) {
	return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function partnerView(p, referredCount = 0) {
	return {
		id: String(p._id),
		name: p.name,
		nip: p.nip || '',
		email: p.email,
		code: p.code,
		commissionRate: p.commissionRate,
		commissionMonths: p.commissionMonths ?? null,
		status: p.status,
		partnerTeamId: p.partnerTeamId ? String(p.partnerTeamId) : null,
		notes: p.notes || '',
		referredCount,
		createdAt: p.createdAt,
	}
}

/**
 * Przy rejestracji zespołu: pola polecenia z kodu ?ref (aktywny partner, bez samopolecenia) albo {}.
 * Zły, nieznany lub wstrzymany kod nie blokuje rejestracji — zespół po prostu nie ma partnera.
 */
async function referralFieldsForRegistration({ referralCode, adminEmail, now = new Date() }) {
	const code = normalizeReferralCode(referralCode)
	if (!code) return {}
	const partner = await Partner.findOne({ code }).lean()
	if (!canReceiveReferrals(partner)) return {}
	if (isSelfReferral({ partner, adminEmail })) return {}
	return { referredByPartnerId: partner._id, referredAt: now, referralSource: 'link' }
}

/** Dane partnera z formularza admina — częściowa aktualizacja tylko pól obecnych w żądaniu */
async function buildPartnerFields(input, { partial }) {
	const out = {}
	if (!partial || input.name !== undefined) {
		const name = String(input.name ?? '').trim()
		if (!name) throw httpError(400, 'Podaj nazwę partnera')
		out.name = name
	}
	if (!partial || input.email !== undefined) {
		const email = String(input.email ?? '').trim().toLowerCase()
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Podaj poprawny e-mail partnera')
		out.email = email
	}
	if (!partial || input.code !== undefined) {
		const code = normalizeReferralCode(input.code)
		if (!code) throw httpError(400, 'Kod: 3–32 znaki, małe litery, cyfry i myślnik (np. biuro123)')
		out.code = code
	}
	if (input.nip !== undefined) out.nip = String(input.nip ?? '').trim()
	if (input.notes !== undefined) out.notes = String(input.notes ?? '').slice(0, 2000)
	if (input.commissionRate !== undefined) {
		const rate = Number(input.commissionRate)
		if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw httpError(400, 'Stawka prowizji musi być między 0 a 1 (np. 0.2 = 20%)')
		out.commissionRate = rate
	}
	if (input.commissionMonths !== undefined) {
		const raw = input.commissionMonths
		if (raw === null || raw === '') out.commissionMonths = null
		else {
			const months = Number(raw)
			if (!Number.isInteger(months) || months < 1) throw httpError(400, 'Okres prowizji: liczba miesięcy (≥ 1) albo puste = bezterminowo')
			out.commissionMonths = months
		}
	}
	if (input.status !== undefined) {
		if (!['active', 'paused'].includes(input.status)) throw httpError(400, 'Status: active albo paused')
		out.status = input.status
	}
	if (input.partnerTeamId !== undefined) {
		if (input.partnerTeamId === null || input.partnerTeamId === '') out.partnerTeamId = null
		else {
			if (!mongoose.Types.ObjectId.isValid(String(input.partnerTeamId))) throw httpError(400, 'Nieprawidłowy zespół partnera')
			const team = await Team.findById(input.partnerTeamId).select('_id').lean()
			if (!team) throw httpError(404, 'Zespół partnera nie istnieje')
			out.partnerTeamId = team._id
		}
	}
	return out
}

function mapDuplicate(error) {
	if (error?.code === 11000) {
		const field = Object.keys(error.keyPattern || {})[0]
		return httpError(409, field === 'partnerTeamId' ? 'Ten zespół jest już przypisany do innego partnera' : 'Taki kod partnera już istnieje', 'DUPLICATE')
	}
	return error
}

async function listPartners() {
	const [partners, counts] = await Promise.all([
		Partner.find({}).sort({ createdAt: -1 }).lean(),
		Team.aggregate([{ $match: { referredByPartnerId: { $ne: null } } }, { $group: { _id: '$referredByPartnerId', n: { $sum: 1 } } }]),
	])
	const byPartner = new Map(counts.map(c => [String(c._id), c.n]))
	return partners.map(p => partnerView(p, byPartner.get(String(p._id)) || 0))
}

async function createPartner(input) {
	const fields = await buildPartnerFields(input || {}, { partial: false })
	try {
		const partner = await Partner.create(fields)
		return partnerView(partner.toObject())
	} catch (error) {
		throw mapDuplicate(error)
	}
}

async function updatePartner(partnerId, input) {
	if (!mongoose.Types.ObjectId.isValid(String(partnerId))) throw httpError(404, 'Partner nie istnieje')
	const fields = await buildPartnerFields(input || {}, { partial: true })
	try {
		const partner = await Partner.findByIdAndUpdate(partnerId, { $set: fields }, { new: true, runValidators: true }).lean()
		if (!partner) throw httpError(404, 'Partner nie istnieje')
		return partnerView(partner)
	} catch (error) {
		throw mapDuplicate(error)
	}
}

async function listReferredTeams(partnerId) {
	if (!mongoose.Types.ObjectId.isValid(String(partnerId))) throw httpError(404, 'Partner nie istnieje')
	const teams = await Team.find({ referredByPartnerId: partnerId })
		.select('name billingPlanKey billingStatus referredAt referralSource isActive createdAt')
		.sort({ referredAt: -1 })
		.lean()
	return teams.map(t => ({
		id: String(t._id),
		name: t.name,
		planKey: t.billingPlanKey || null,
		billingStatus: t.billingStatus || null,
		referredAt: t.referredAt,
		referralSource: t.referralSource,
		isActive: t.isActive !== false,
		createdAt: t.createdAt,
	}))
}

async function searchTeams(query) {
	const q = String(query || '').trim()
	if (q.length < 2) return []
	const teams = await Team.find({ name: { $regex: escapeRegex(q), $options: 'i' } })
		.select('name adminEmail referredByPartnerId isActive')
		.limit(20)
		.lean()
	return teams.map(t => ({
		id: String(t._id),
		name: t.name,
		adminEmail: t.adminEmail,
		referredByPartnerId: t.referredByPartnerId ? String(t.referredByPartnerId) : null,
		isActive: t.isActive !== false,
	}))
}

/** Ręczne przypisanie zespołu do partnera (albo odpięcie: partnerId = null) przez admina platformy */
async function assignTeamToPartner(teamId, partnerId, now = new Date()) {
	if (!mongoose.Types.ObjectId.isValid(String(teamId))) throw httpError(404, 'Zespół nie istnieje')
	const team = await Team.findById(teamId).select('adminEmail billingInvoiceNip')
	if (!team) throw httpError(404, 'Zespół nie istnieje')
	if (partnerId === null || partnerId === '') {
		team.referredByPartnerId = null
		team.referredAt = null
		team.referralSource = null
		await team.save()
		return { teamId: String(team._id), partnerId: null }
	}
	if (!mongoose.Types.ObjectId.isValid(String(partnerId))) throw httpError(404, 'Partner nie istnieje')
	const partner = await Partner.findById(partnerId).lean()
	if (!partner) throw httpError(404, 'Partner nie istnieje')
	if (isSelfReferral({ partner, teamId: team._id, adminEmail: team.adminEmail, nip: team.billingInvoiceNip })) {
		throw httpError(400, 'To zespół samego partnera — samopolecenie jest zablokowane', 'SELF_REFERRAL')
	}
	team.referredByPartnerId = partner._id
	team.referredAt = now
	team.referralSource = 'admin'
	await team.save()
	return { teamId: String(team._id), partnerId: String(partner._id) }
}

module.exports = {
	referralFieldsForRegistration,
	listPartners,
	createPartner,
	updatePartner,
	listReferredTeams,
	searchTeams,
	assignTeamToPartner,
}
