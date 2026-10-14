/**
 * Kody polecające programu partnerskiego — czyste funkcje (bez bazy, testy w server/tests/referralCode.test.js).
 * Kod: 3–32 znaki, małe litery, cyfry i myślnik (nie na początku ani na końcu), np. „biuro123”.
 */

const CODE_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

function normalizeReferralCode(raw) {
	const code = String(raw ?? '').trim().toLowerCase()
	return CODE_RE.test(code) ? code : null
}

function digitsOnly(value) {
	return String(value ?? '').replace(/\D/g, '')
}

/**
 * Samopolecenie: firma partnera nie może być poleconą firmą — ten sam zespół, ten sam e-mail albo ten sam NIP.
 * NIP firma zwykle podaje dopiero przy zakupie, więc sprawdzamy go także przy naliczaniu prowizji.
 */
function isSelfReferral({ partner, teamId = null, adminEmail = '', nip = '' }) {
	if (!partner) return false
	if (teamId && partner.partnerTeamId && String(partner.partnerTeamId) === String(teamId)) return true
	const email = String(adminEmail || '').trim().toLowerCase()
	if (email && String(partner.email || '').trim().toLowerCase() === email) return true
	const teamNip = digitsOnly(nip)
	if (teamNip.length >= 10 && digitsOnly(partner.nip) === teamNip) return true
	return false
}

/** Partner, który może dziś dostać polecenie: aktywny i z poprawnym kodem */
function canReceiveReferrals(partner) {
	return Boolean(partner && partner.status === 'active' && normalizeReferralCode(partner.code))
}

/**
 * Prosta kontrola formatu e-maila w czasie liniowym (bez wyrażenia z nawracaniem): jedna „@”, niepusta część
 * lokalna, domena z kropką, bez białych znaków. Wywołujący i tak ogranicza długość.
 */
function isPlausibleEmail(value) {
	if (typeof value !== 'string' || /\s/.test(value)) return false
	const at = value.indexOf('@')
	if (at < 1 || at !== value.lastIndexOf('@')) return false
	const domain = value.slice(at + 1)
	const dot = domain.lastIndexOf('.')
	return dot > 0 && dot < domain.length - 1
}

module.exports = {
	isPlausibleEmail,
	normalizeReferralCode,
	isSelfReferral,
	canReceiveReferrals,
	digitsOnly,
}
