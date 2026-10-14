/**
 * Biuro rachunkowe — czyste reguły dostępu (bez bazy, testy w server/tests/officeAccessPolicy.test.js).
 * Biuro = zespół z organizationType 'office'; panel biura dla Admin/HR tego zespołu. Powiązaniami z biurem
 * po stronie firmy zarządza wyłącznie Admin firmy (zgoda na udostępnienie danych kadrowych).
 */
const moment = require('moment-timezone')

const ZONE = 'Europe/Warsaw'
const OFFICE_PANEL_ROLES = ['Admin', 'HR']

const rolesOf = roles => (Array.isArray(roles) ? roles : [])

function canUseOfficePanel({ roles, organizationType }) {
	return organizationType === 'office' && rolesOf(roles).some(r => OFFICE_PANEL_ROLES.includes(r))
}

function canManageOfficeLinks(roles) {
	return rolesOf(roles).includes('Admin')
}

/** Rok i miesiąc (0–11, jak w kalendarzach aplikacji) z zapytania; null przy złych danych */
function parseYearMonth(yearRaw, monthRaw) {
	if (typeof yearRaw !== 'string' || typeof monthRaw !== 'string') return null
	if (!/^\d{4}$/.test(yearRaw) || !/^\d{1,2}$/.test(monthRaw)) return null
	const year = Number(yearRaw)
	const month = Number(monthRaw)
	if (year < 2020 || year > 2100 || month < 0 || month > 11) return null
	return { year, month }
}

/**
 * Zakres zapytania o dni miesiąca: granice w czasie polskim plus dzień zapasu z każdej strony —
 * dni pracy bywają zapisane jako północ lokalna albo UTC, a dokładny podział robi klient tak jak w liście ewidencji.
 */
function monthQueryRange(year, month) {
	const start = moment.tz({ year, month, day: 1 }, ZONE)
	const end = start.clone().add(1, 'month')
	return {
		start: start.toDate(),
		end: end.toDate(),
		queryStart: start.clone().subtract(1, 'day').toDate(),
		queryEnd: end.clone().add(1, 'day').toDate(),
	}
}

const sameEmail = (a, b) => Boolean(a) && String(a).trim().toLowerCase() === String(b || '').trim().toLowerCase()

/** Czy Admin firmy może przyjąć zaproszenie: oczekujące, od biura, wysłane na e-mail administratora tej firmy */
function canAcceptInvite(access, adminEmail) {
	return Boolean(access && access.status === 'pending' && access.initiatedBy === 'office' && sameEmail(access.invitedEmail, adminEmail))
}

/** Biuro kończy swoje powiązania; firma — aktywne ze swoją firmą i zaproszenia na e-mail swojego administratora */
function canEndLink(access, { teamId, side, adminEmail = '' }) {
	if (!access || !['pending', 'active'].includes(access.status)) return false
	if (side === 'office') return String(access.officeTeamId) === String(teamId)
	if (access.status === 'pending') return sameEmail(access.invitedEmail, adminEmail)
	return String(access.clientTeamId) === String(teamId)
}

module.exports = {
	OFFICE_ZONE: ZONE,
	OFFICE_PANEL_ROLES,
	canUseOfficePanel,
	canManageOfficeLinks,
	parseYearMonth,
	monthQueryRange,
	canAcceptInvite,
	canEndLink,
}
