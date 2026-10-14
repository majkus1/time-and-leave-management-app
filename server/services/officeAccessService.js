const mongoose = require('mongoose')
const moment = require('moment-timezone')
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const Partner = require('../models/Partner')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
const LegalDocument = require('../models/LegalDocument')(firmDb)
const OfficeAccess = require('../models/OfficeAccess')(firmDb)
const OfficeAuditLog = require('../models/OfficeAuditLog')(firmDb)
const { ACTIVE_USER_FILTER } = require('../utils/teamScopeAccess')
const { normalizeReferralCode, isSelfReferral, isPlausibleEmail } = require('../utils/referralCode')
const { buildPersonalLeaveLimits } = require('./dashboardSummaryHelpers')
const { sendOfficeInviteEmail } = require('./emailService')
const {
	OFFICE_ZONE,
	canUseOfficePanel,
	canManageOfficeLinks,
	parseYearMonth,
	monthQueryRange,
	canAcceptInvite,
	canEndLink,
	DECLINE_COOLDOWN_MS,
	visiblePendingInvites,
} = require('../utils/officeAccessPolicy')

const OPEN = ['pending', 'active']
const INVITE_MAIL_INTERVAL_MS = 7 * 24 * 3600e3
const SETTINGS_FIELDS = [
	'workOnWeekends',
	'includePolishHolidays',
	'includeCustomHolidays',
	'customHolidays',
	'leaveRequestTypes',
	'leaveCalculationMode',
	'leaveHoursPerDay',
	'autoDeductLeaveLimits',
]

function httpError(status, message, code) {
	const err = new Error(message)
	err.status = status
	if (code) err.code = code
	return err
}

const oid = v => (mongoose.Types.ObjectId.isValid(String(v ?? '')) ? new mongoose.Types.ObjectId(String(v)) : null)

async function currentDpaVersion() {
	const doc = await LegalDocument.findOne({ type: 'DPA', isCurrent: true }).select('version').lean()
	return doc?.version || ''
}

function consentMeta(meta = {}) {
	return {
		consentIp: String(meta.ip || '').slice(0, 100),
		consentUserAgent: String(meta.userAgent || '').slice(0, 500),
	}
}

/**
 * Firma powiązana z biurem-partnerem, która nie ma jeszcze partnera, trafia do tego biura (źródło office_link).
 * Warunkowy zapis — nie nadpisze partnera ustawionego w międzyczasie. Błąd nie blokuje powiązania.
 *
 * WYŁĄCZONE (OFFICE_LINK_REFERRAL_ENABLED): polecenie dawałoby biuru wgląd w płatności firmy w panelu partnera,
 * którego zgoda na dane kadrowe nie obejmuje i który zostaje po odebraniu dostępu; płaciłoby też prowizję za
 * firmy, które już są klientami. Prowizja tylko z linku ?ref albo przypisania przez admina platformy.
 */
const OFFICE_LINK_REFERRAL_ENABLED = false

async function assignReferralThroughOffice(clientTeamId, officeTeamId, now = new Date()) {
	if (!OFFICE_LINK_REFERRAL_ENABLED) return
	try {
		const partner = await Partner.findOne({ partnerTeamId: officeTeamId, status: 'active' }).lean()
		if (!partner) return
		const team = await Team.findById(clientTeamId).select('referredByPartnerId adminEmail billingInvoiceNip').lean()
		if (!team || team.referredByPartnerId) return
		if (isSelfReferral({ partner, teamId: team._id, adminEmail: team.adminEmail, nip: team.billingInvoiceNip })) return
		await Team.updateOne(
			{ _id: team._id, $or: [{ referredByPartnerId: null }, { referredByPartnerId: { $exists: false } }] },
			{ $set: { referredByPartnerId: partner._id, referredAt: now, referralSource: 'office_link' } }
		)
	} catch (error) {
		console.error('[office] przypisanie firmy do biura-partnera nie powiodło się:', error?.message || error)
	}
}

// ——— strona firmy (Admin firmy) ———

/** Admin firmy + e-mail administratora zespołu (na niego biuro wysyła zaproszenia) */
async function companyContext(user) {
	if (!canManageOfficeLinks(user?.roles)) throw httpError(403, 'Biurem rachunkowym zarządza administrator firmy', 'ADMIN_ONLY')
	const clientTeamId = oid(user?.teamId)
	const team = clientTeamId ? await Team.findById(clientTeamId).select('adminEmail').lean() : null
	if (!team) throw httpError(403, 'Brak zespołu')
	return { clientTeamId, adminEmail: String(team.adminEmail || '').trim().toLowerCase() }
}

async function linkView(access, otherTeamId) {
	const team = otherTeamId ? await Team.findById(otherTeamId).select('name').lean() : null
	return {
		id: String(access._id),
		status: access.status,
		initiatedBy: access.initiatedBy,
		teamName: team?.name || '—',
		createdAt: access.createdAt,
		acceptedAt: access.acceptedAt,
		endedAt: access.endedAt,
		endedBy: access.endedBy,
	}
}

async function companyLinks(user) {
	const { clientTeamId, adminEmail } = await companyContext(user)
	const [active, invites, ended, cooldown, dpaVersion] = await Promise.all([
		OfficeAccess.find({ clientTeamId, status: 'active' }).sort({ acceptedAt: -1 }).lean(),
		adminEmail ? OfficeAccess.find({ status: 'pending', invitedEmail: adminEmail }).sort({ createdAt: -1 }).lean() : [],
		OfficeAccess.find({ clientTeamId, status: { $in: ['revoked', 'declined'] } }).sort({ endedAt: -1 }).limit(10).lean(),
		// Okres ciszy osobnym zapytaniem — niezależnie od tego, ile wpisów pokazuje historia
		OfficeAccess.find({ clientTeamId, endedBy: 'company', endedAt: { $gte: new Date(Date.now() - DECLINE_COOLDOWN_MS) } }).select('officeTeamId').lean(),
		currentDpaVersion(),
	])
	const pending = visiblePendingInvites({
		invites,
		activeOfficeIds: active.map(a => a.officeTeamId),
		cooldownOfficeIds: cooldown.map(c => c.officeTeamId),
		clientTeamId,
	})
	return {
		dpaVersion,
		links: await Promise.all([...pending, ...active].map(a => linkView(a, a.officeTeamId))),
		history: await Promise.all(ended.map(a => linkView(a, a.officeTeamId))),
	}
}

/** Przyjęcie zaproszenia: firma staje się stroną powiązania dopiero teraz (clientTeamId) */
async function activate(access, user, meta, clientTeamId) {
	let res
	try {
		res = await OfficeAccess.updateOne(
			{ _id: access._id, status: 'pending' },
			{ $set: { status: 'active', clientTeamId, acceptedByUserId: user.userId, acceptedAt: new Date(), dpaVersion: await currentDpaVersion(), ...consentMeta(meta) } }
		)
	} catch (error) {
		if (error?.code === 11000) throw httpError(409, 'To biuro ma już dostęp', 'ALREADY_ACTIVE')
		throw error
	}
	if (res.modifiedCount !== 1) throw httpError(409, 'To zaproszenie zostało już obsłużone — odśwież stronę')
	await assignReferralThroughOffice(clientTeamId, access.officeTeamId)
}

/** Firma dodaje biuro po kodzie biura (kod partnera) — od razu aktywne, bo zgodę daje właśnie Admin firmy */
async function connectByCode(user, { code, consent }, meta) {
	const { clientTeamId, adminEmail } = await companyContext(user)
	if (consent !== true) throw httpError(400, 'Potwierdź zgodę na udostępnienie danych biuru', 'CONSENT_REQUIRED')
	const normalized = normalizeReferralCode(code)
	const partner = normalized ? await Partner.findOne({ code: normalized }).select('partnerTeamId').lean() : null
	const office = partner?.partnerTeamId ? await Team.findById(partner.partnerTeamId).select('organizationType isActive name').lean() : null
	if (!office || office.organizationType !== 'office' || office.isActive === false) throw httpError(404, 'Nie ma biura rachunkowego z takim kodem', 'OFFICE_NOT_FOUND')
	if (String(office._id) === String(clientTeamId)) throw httpError(400, 'To Twój własny zespół')
	if (await OfficeAccess.exists({ officeTeamId: office._id, clientTeamId, status: 'active' })) throw httpError(409, 'To biuro ma już dostęp', 'ALREADY_ACTIVE')
	// Biuro wcześniej zaprosiło tę firmę — dodanie po kodzie przyjmuje to zaproszenie
	const invite = adminEmail ? await OfficeAccess.findOne({ officeTeamId: office._id, status: 'pending', invitedEmail: adminEmail }).lean() : null
	if (invite) {
		await activate(invite, user, meta, clientTeamId)
		return { id: String(invite._id), officeName: office.name }
	}
	try {
		const created = await OfficeAccess.create({
			officeTeamId: office._id,
			clientTeamId,
			status: 'active',
			initiatedBy: 'company',
			createdByUserId: user.userId,
			acceptedByUserId: user.userId,
			acceptedAt: new Date(),
			dpaVersion: await currentDpaVersion(),
			...consentMeta(meta),
		})
		await assignReferralThroughOffice(clientTeamId, office._id)
		return { id: String(created._id), officeName: office.name }
	} catch (error) {
		if (error?.code === 11000) throw httpError(409, 'To biuro ma już dostęp — odśwież stronę', 'DUPLICATE')
		throw error
	}
}

async function findOwn(id, filter) {
	const _id = oid(id)
	const access = _id ? await OfficeAccess.findOne({ _id, ...filter }).lean() : null
	if (!access) throw httpError(404, 'Nie ma takiego powiązania')
	return access
}

/** Powiązanie widoczne dla firmy: z jej zespołem albo zaproszenie na e-mail jej administratora */
function companyFindOwn(id, { clientTeamId, adminEmail }) {
	const or = [{ clientTeamId }]
	if (adminEmail) or.push({ status: 'pending', invitedEmail: adminEmail })
	return findOwn(id, { $or: or })
}

async function acceptInvite(user, id, { consent }, meta) {
	const ctx = await companyContext(user)
	if (consent !== true) throw httpError(400, 'Potwierdź zgodę na udostępnienie danych biuru', 'CONSENT_REQUIRED')
	const access = await companyFindOwn(id, ctx)
	if (!canAcceptInvite(access, ctx.adminEmail)) throw httpError(409, 'To zaproszenie zostało już obsłużone — odśwież stronę')
	if (String(access.officeTeamId) === String(ctx.clientTeamId)) throw httpError(400, 'To Twój własny zespół')
	// Zaproszenie od zespołu, który przestał być biurem (albo jest nieaktywny), nie może dać dostępu
	const office = await Team.findById(access.officeTeamId).select('organizationType isActive').lean()
	if (!office || office.organizationType !== 'office' || office.isActive === false) {
		throw httpError(409, 'To biuro nie jest już dostępne w Planopii', 'OFFICE_UNAVAILABLE')
	}
	await activate(access, user, meta, ctx.clientTeamId)
	return { id: String(access._id) }
}

async function endLink(access, user, side, status, extra = {}) {
	const res = await OfficeAccess.updateOne(
		{ _id: access._id, status: { $in: OPEN } },
		{ $set: { status, endedAt: new Date(), endedBy: side, endedByUserId: user.userId, ...extra } }
	)
	if (res.modifiedCount !== 1) throw httpError(409, 'To powiązanie zostało już zakończone — odśwież stronę')
	return { id: String(access._id), status }
}

/** Firma odrzuca zaproszenie albo odbiera dostęp — działa od następnego zapytania biura */
async function companyEndLink(user, id) {
	const ctx = await companyContext(user)
	const access = await companyFindOwn(id, ctx)
	if (!canEndLink(access, { teamId: ctx.clientTeamId, side: 'company', adminEmail: ctx.adminEmail })) {
		throw httpError(409, 'To powiązanie zostało już zakończone — odśwież stronę')
	}
	// Odrzucone zaproszenie trafia do historii tej firmy
	return access.status === 'pending'
		? endLink(access, user, 'company', 'declined', { clientTeamId: ctx.clientTeamId })
		: endLink(access, user, 'company', 'revoked')
}

// ——— strona biura (Admin/HR zespołu-biura) ———

/** Typ zespołu z bazy, nie z tokena — zmiana typu przez admina platformy działa od razu */
async function requireOffice(user) {
	const officeTeamId = oid(user?.teamId)
	const team = officeTeamId ? await Team.findById(officeTeamId).select('name organizationType isActive').lean() : null
	if (!team || team.isActive === false || !canUseOfficePanel({ roles: user?.roles, organizationType: team.organizationType })) {
		throw httpError(403, 'Panel biura rachunkowego jest dostępny dla administratora i HR biura', 'NOT_OFFICE')
	}
	return team
}

async function officeMe(user) {
	try {
		await requireOffice(user)
		return { isOffice: true }
	} catch (error) {
		if (error.status === 403) return { isOffice: false }
		throw error
	}
}

async function officeClients(user) {
	const office = await requireOffice(user)
	const links = await OfficeAccess.find({ officeTeamId: office._id, status: { $in: OPEN } }).sort({ acceptedAt: -1, createdAt: -1 }).lean()
	const active = links.filter(l => l.status === 'active')
	const teams = await Team.find({ _id: { $in: active.map(l => l.clientTeamId) } }).select('name isActive').lean()
	const byId = new Map(teams.map(t => [String(t._id), t]))
	return {
		office: { name: office.name },
		clients: active
			.filter(l => byId.get(String(l.clientTeamId))?.isActive !== false)
			.map(l => ({ id: String(l._id), clientTeamId: String(l.clientTeamId), name: byId.get(String(l.clientTeamId))?.name || '—', since: l.acceptedAt })),
		// Oczekujące: tylko e-mail, na który wysłano zaproszenie — nazwa firmy dopiero po jej zgodzie
		invites: links.filter(l => l.status === 'pending').map(l => ({ id: String(l._id), email: l.invitedEmail, createdAt: l.createdAt })),
	}
}

/**
 * Zaproszenie firmy po e-mailu jej administratora — zapisujemy je zawsze, bez sprawdzania, czy taka firma istnieje.
 * Odpowiedź i lista zaproszeń wyglądają tak samo dla każdego adresu, więc z panelu biura nie da się sprawdzić,
 * kto ma konto w Planopii. Firma zobaczy zaproszenie po e-mailu swojego administratora (także po późniejszej rejestracji).
 */
async function inviteCompany(user, { email }) {
	const office = await requireOffice(user)
	const normalized = typeof email === 'string' ? email.trim().toLowerCase() : ''
	// Długość przed wyrażeniem — na długim tekście sprawdzenie formatu trwałoby sekundy (blokada serwera)
	if (normalized.length > 200 || !isPlausibleEmail(normalized)) throw httpError(400, 'Podaj poprawny e-mail administratora firmy')
	let created = null
	try {
		created = await OfficeAccess.create({ officeTeamId: office._id, clientTeamId: null, status: 'pending', initiatedBy: 'office', invitedEmail: normalized, createdByUserId: user.userId })
	} catch (error) {
		if (error?.code !== 11000) throw error
	}
	// Mail tylko przy nowym zaproszeniu i w tle — odpowiedź (i jej czas) nie zależy od tego, czy firma istnieje
	if (created) setImmediate(() => void notifyInvitedCompany(office, normalized, created._id))
	return { ok: true }
}

/** Mail do administratora firmy — tylko gdy firma istnieje, nie ma już dostępu dla tego biura i nie odmówiła mu niedawno */
async function notifyInvitedCompany(office, email, inviteId) {
	try {
		// Najwyżej jeden mail od tego biura na ten adres w tygodniu — „zaproś, wycofaj, zaproś” nie zrobi z tego spamu
		const recentInvite = await OfficeAccess.exists({
			_id: { $ne: inviteId },
			officeTeamId: office._id,
			invitedEmail: email,
			createdAt: { $gte: new Date(Date.now() - INVITE_MAIL_INTERVAL_MS) },
		})
		if (recentInvite) return
		const company = await Team.findOne({ adminEmail: email, isActive: { $ne: false } }).select('name').lean()
		if (!company || String(company._id) === String(office._id)) return
		const blocked = await OfficeAccess.exists({
			officeTeamId: office._id,
			clientTeamId: company._id,
			$or: [{ status: 'active' }, { endedBy: 'company', endedAt: { $gte: new Date(Date.now() - DECLINE_COOLDOWN_MS) } }],
		})
		if (blocked) return
		await sendOfficeInviteEmail(email, { officeName: office.name, companyName: company.name })
		console.log('[office] wysłano mail o zaproszeniu od biura')
	} catch (error) {
		console.error('[office] nie wysłano maila o zaproszeniu:', error?.message || error)
	}
}

async function officeEndLink(user, id) {
	const office = await requireOffice(user)
	const access = await findOwn(id, { officeTeamId: office._id })
	if (!canEndLink(access, { teamId: office._id, side: 'office' })) throw httpError(409, 'To powiązanie zostało już zakończone — odśwież stronę')
	return endLink(access, user, 'office', 'revoked')
}

/**
 * Jedyna droga biura do danych firmy: aktywne powiązanie tego biura z tą firmą. Brak powiązania i obca firma
 * dają ten sam 404 — biuro nie dowie się, czy firma istnieje.
 */
async function resolveOfficeClient(user, clientTeamIdRaw) {
	const office = await requireOffice(user)
	const clientTeamId = oid(clientTeamIdRaw)
	const access = clientTeamId ? await OfficeAccess.findOne({ officeTeamId: office._id, clientTeamId, status: 'active' }).lean() : null
	const client = access ? await Team.findById(clientTeamId).select('name isActive').lean() : null
	if (!access || !client || client.isActive === false) throw httpError(404, 'Brak dostępu do tej firmy', 'NO_ACCESS')
	return { office, client, access }
}

/** Wpis do historii dostępu firmy. Obowiązkowy: gdy zapis się nie uda, biuro nie dostaje danych (firma ma pełny ślad). */
async function audit({ office, client, user, action, params, ip }) {
	try {
		await OfficeAuditLog.create({ officeTeamId: office._id, clientTeamId: client._id, userId: user.userId, action, params, ip: String(ip || '').slice(0, 100) })
	} catch (error) {
		console.error('[office] zapis logu audytowego nie powiódł się — dane nie zostały wydane:', error?.message || error)
		throw httpError(503, 'Chwilowy problem — spróbuj ponownie za moment')
	}
}

/**
 * Miesiąc firmy dla biura: pracownicy (bez e-maili), dni pracy, zatwierdzone nieobecności, salda urlopów na rok
 * i potwierdzenia miesiąca. Podsumowania liczy klient tymi samymi funkcjami co lista ewidencji w aplikacji.
 */
async function clientMonth(user, clientTeamIdRaw, query, ip, action = 'view_month') {
	const ym = parseYearMonth(query?.year, query?.month)
	if (!ym) throw httpError(400, 'Podaj rok i miesiąc (0–11)')
	const { office, client } = await resolveOfficeClient(user, clientTeamIdRaw)
	const { queryStart, queryEnd } = monthQueryRange(ym.year, ym.month)
	const yearStart = moment.tz({ year: ym.year, month: 0, day: 1 }, OFFICE_ZONE).toDate()
	const yearEnd = moment.tz({ year: ym.year + 1, month: 0, day: 1 }, OFFICE_ZONE).toDate()

	// Bez .lean(): wartości domyślne ustawień (np. leaveHoursPerDay) muszą dojść do obliczeń
	const settingsDoc = await Settings.findOne({ teamId: client._id }).select(SETTINGS_FIELDS.join(' '))
	const settings = settingsDoc ? settingsDoc.toObject() : {}
	delete settings._id
	const users = await User.find({ teamId: client._id, ...ACTIVE_USER_FILTER })
		.select('firstName lastName position department leaveTypeDays vacationDays')
		.sort({ lastName: 1, firstName: 1 })
		.lean()
	const userIds = users.map(u => u._id)
	const [workdays, monthLeaves, yearLeaves, confirmations] = await Promise.all([
		Workday.find({ userId: { $in: userIds }, date: { $gte: queryStart, $lt: queryEnd } })
			.select('userId date hoursWorked additionalWorked absenceType')
			.lean(),
		LeaveRequest.find({ userId: { $in: userIds }, status: { $in: ['status.accepted', 'status.sent'] }, startDate: { $lt: queryEnd }, endDate: { $gte: queryStart } })
			.select('userId type startDate endDate hoursRequested settlementUnit daysRequested')
			.lean(),
		LeaveRequest.find({ userId: { $in: userIds }, startDate: { $lt: yearEnd }, endDate: { $gte: yearStart } }).lean(),
		CalendarConfirmation.find({ userId: { $in: userIds }, month: ym.month, year: ym.year }).select('userId isConfirmed confirmedAt').lean(),
	])
	const leavesByUser = new Map()
	for (const r of yearLeaves) {
		const key = String(r.userId)
		if (!leavesByUser.has(key)) leavesByUser.set(key, [])
		leavesByUser.get(key).push(r)
	}
	const confirmationByUser = new Map(confirmations.map(c => [String(c.userId), c]))

	await audit({ office, client, user, action, params: ym, ip })

	return {
		company: { id: String(client._id), name: client.name },
		year: ym.year,
		month: ym.month,
		settings,
		users: users.map(u => {
			const confirmation = confirmationByUser.get(String(u._id))
			return {
				id: String(u._id),
				firstName: u.firstName,
				lastName: u.lastName,
				position: u.position || '',
				leaveLimits: buildPersonalLeaveLimits({ viewerDoc: u, ownRequests: leavesByUser.get(String(u._id)) || [], settings, year: ym.year }),
				confirmed: confirmation?.isConfirmed === true,
				confirmedAt: confirmation?.isConfirmed ? confirmation.confirmedAt : null,
			}
		}),
		workdays: workdays.map(w => ({ userId: String(w.userId), date: w.date, hoursWorked: w.hoursWorked, additionalWorked: w.additionalWorked, absenceType: w.absenceType })),
		leaves: monthLeaves.map(l => ({
			userId: String(l.userId),
			type: l.type,
			startDate: l.startDate,
			endDate: l.endDate,
			hoursRequested: l.hoursRequested,
			settlementUnit: l.settlementUnit,
			daysRequested: l.daysRequested,
		})),
	}
}

/**
 * Dane do eksportu PDF/Excel miesiąca. Plik buduje przeglądarka z tych samych sum, które biuro widzi w panelu
 * (jedno źródło obliczeń, czas polski przeglądarki), a serwer zapisuje eksport w logu audytowym firmy.
 */
async function clientMonthExport(user, clientTeamIdRaw, body, ip) {
	const format = body?.format === 'pdf' ? 'pdf' : body?.format === 'xlsx' ? 'xlsx' : null
	if (!format) throw httpError(400, 'Format: pdf albo xlsx')
	// Rok i miesiąc jako tekst — te same reguły co w zapytaniu GET (parseYearMonth odrzuca obiekty)
	const query = { year: typeof body?.year === 'number' ? String(body.year) : body?.year, month: typeof body?.month === 'number' ? String(body.month) : body?.month }
	return clientMonth(user, clientTeamIdRaw, query, ip, format === 'pdf' ? 'export_pdf' : 'export_xlsx')
}

/** Wpisy logu z nazwą biura i osoby z biura */
async function auditView(entries) {
	const [teams, users] = await Promise.all([
		Team.find({ _id: { $in: [...new Set(entries.flatMap(e => [String(e.officeTeamId), String(e.clientTeamId)]))] } }).select('name').lean(),
		User.find({ _id: { $in: [...new Set(entries.map(e => String(e.userId)))] } }).select('firstName lastName').lean(),
	])
	const teamName = new Map(teams.map(t => [String(t._id), t.name]))
	const userName = new Map(users.map(u => [String(u._id), `${u.firstName || ''} ${u.lastName || ''}`.trim()]))
	return entries.map(e => ({
		id: String(e._id),
		officeName: teamName.get(String(e.officeTeamId)) || '—',
		clientName: teamName.get(String(e.clientTeamId)) || '—',
		userName: userName.get(String(e.userId)) || '—',
		action: e.action,
		year: e.params?.year ?? null,
		month: e.params?.month ?? null,
		at: e.at,
	}))
}

/** Firma (Admin): kto z biura i kiedy oglądał albo eksportował jej dane — ostatnie 200 wpisów */
async function companyAudit(user) {
	const { clientTeamId } = await companyContext(user)
	const entries = await OfficeAuditLog.find({ clientTeamId }).sort({ at: -1 }).limit(200).lean()
	const view = await auditView(entries)
	return { entries: view.map(({ clientName, ...rest }) => rest) }
}

// ——— admin platformy ———

/** Admin platformy: powiązania biuro–firma i ostatnie wejścia biur */
async function adminOfficeOverview() {
	const [links, entries] = await Promise.all([
		OfficeAccess.find({ status: { $in: ['active', 'pending'] } }).sort({ status: 1, createdAt: -1 }).limit(500).lean(),
		OfficeAuditLog.find({}).sort({ at: -1 }).limit(300).lean(),
	])
	const teams = await Team.find({ _id: { $in: [...new Set(links.flatMap(l => [l.officeTeamId, l.clientTeamId].filter(Boolean).map(String)))] } }).select('name').lean()
	const teamName = new Map(teams.map(t => [String(t._id), t.name]))
	return {
		links: links.map(l => ({
			id: String(l._id),
			officeName: teamName.get(String(l.officeTeamId)) || '—',
			clientName: l.clientTeamId ? teamName.get(String(l.clientTeamId)) || '—' : null,
			invitedEmail: l.status === 'pending' ? l.invitedEmail : '',
			status: l.status,
			initiatedBy: l.initiatedBy,
			createdAt: l.createdAt,
			acceptedAt: l.acceptedAt,
			dpaVersion: l.dpaVersion,
		})),
		audit: await auditView(entries),
	}
}

async function setOrganizationType(teamId, organizationType) {
	const _id = oid(teamId)
	if (!_id) throw httpError(404, 'Zespół nie istnieje')
	if (!['company', 'office'].includes(organizationType)) throw httpError(400, 'Typ: company albo office')
	const team = await Team.findByIdAndUpdate(_id, { $set: { organizationType } }, { new: true }).select('organizationType').lean()
	if (!team) throw httpError(404, 'Zespół nie istnieje')
	// Zespół, który przestaje być biurem, traci wszystkie powiązania i zaproszenia — po przywróceniu typu firmy muszą
	// znów wyrazić zgodę, a nie odzyskać ją po cichu
	let endedLinks = 0
	if (organizationType !== 'office') {
		const res = await OfficeAccess.updateMany(
			{ officeTeamId: _id, status: { $in: OPEN } },
			{ $set: { status: 'revoked', endedBy: 'admin', endedAt: new Date() } }
		)
		endedLinks = res.modifiedCount || 0
	}
	return { teamId: String(_id), organizationType: team.organizationType, endedLinks }
}

module.exports = {
	companyLinks,
	connectByCode,
	acceptInvite,
	companyEndLink,
	officeMe,
	officeClients,
	inviteCompany,
	officeEndLink,
	resolveOfficeClient,
	clientMonth,
	clientMonthExport,
	companyAudit,
	adminOfficeOverview,
	setOrganizationType,
	assignReferralThroughOffice,
}
