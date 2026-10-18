const { firmDb } = require('../db/db')
const LifecycleEmailLog = require('../models/LifecycleEmailLog')(firmDb)
const { sendMail } = require('./emailService')
const { publicAppUrl } = require('../config')
const { buildFounderWelcomeText, FOUNDER_WELCOME_SUBJECT } = require('../utils/founderWelcomeText')

/**
 * Osobisty kontakt twórcy z nowym zespołem — celowo obok automatów lifecycle (inny nadawca, czysty tekst, bez szablonu).
 * Wysyłka tą samą drogą co reszta aplikacji (emailService.sendMail → dostawca z SMTP_*), z adresu w domenie planopia.pl.
 * Konfiguracja w .env (wszystko opcjonalne):
 *   FOUNDER_FROM_EMAIL   — nadawca maili od twórcy i adres do odpowiedzi; domyślnie biuro@planopia.pl
 *   FOUNDER_NOTIFY_EMAIL — dokąd idą powiadomienia dla twórcy (nowy zespół, rezerwacje rozmów); domyślnie jego skrzynka
 *   FOUNDER_CALENDAR_URL — link do rezerwacji; domyślnie własna strona w aplikacji: {appUrl}/umow-rozmowe
 *   FOUNDER_NAME         — podpis, domyślnie „Michał Lipka”
 */
const WELCOME_KIND = 'founder_welcome'
const NEW_TEAM_KIND = 'founder_new_team'

/** Adres nadawcy maili od twórcy — w domenie planopia.pl (odpowiedzi trafiają do biura). */
function founderEmail() {
	return (process.env.FOUNDER_FROM_EMAIL || 'biuro@planopia.pl').trim()
}

/** Skrzynka, w której twórca czyta powiadomienia wewnętrzne — osobna od adresu nadawcy. */
function founderNotifyEmail() {
	return (process.env.FOUNDER_NOTIFY_EMAIL || 'michalipka1@gmail.com').trim()
}

function founderName() {
	return (process.env.FOUNDER_NAME || 'Michał Lipka').trim()
}

function founderCalendarUrl() {
	const url = (process.env.FOUNDER_CALENDAR_URL || '').trim()
	if (/^https?:\/\//i.test(url)) return url
	return `${publicAppUrl}/umow-rozmowe`
}

/**
 * Mail od twórcy (czysty tekst, opcjonalne załączniki).
 * personal=true: podpis nadawcy imieniem i nazwiskiem; w pozostałych przypadkach „Planopia”.
 */
async function sendFounderMail({ to, subject, text, attachments = [], personal = false }) {
	if (!to) return { sent: false, reason: 'no-recipient' }
	await sendMail({
		from: personal ? `"${founderName()}" <${founderEmail()}>` : `"Planopia" <${founderEmail()}>`,
		replyTo: founderEmail(),
		to,
		subject,
		text,
		attachments,
	})
	return { sent: true }
}

/** Jak lifecycle: jeden mail danego rodzaju na zespół; przy błędzie wysyłki wpis jest zwalniany. */
async function claim(teamId, kind, to) {
	try {
		await LifecycleEmailLog.create({ teamId, kind, to })
		return true
	} catch (e) {
		if (e.code === 11000) return false
		throw e
	}
}

async function release(teamId, kind) {
	await LifecycleEmailLog.deleteOne({ teamId, kind }).catch(() => {})
}

/** Telefon z formularza: tylko cyfry, plus, spacje, myślniki, nawiasy; pusty gdy nic sensownego. */
function normalizePhone(raw) {
	const s = String(raw || '').replace(/[^\d+\s()-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32)
	return /\d{6,}/.test(s.replace(/\D/g, '')) ? s : ''
}

function buildWelcomeText(team) {
	return buildFounderWelcomeText({
		adminFirstName: team.adminFirstName,
		teamName: team.name,
		phone: team.adminPhone,
		calendarUrl: founderCalendarUrl(),
		founderName: founderName(),
		replyEmail: founderEmail(),
	})
}

/** Powitanie od twórcy — czysty tekst, z adresu biura w domenie planopia.pl. */
async function sendFounderWelcome(team) {
	if (!team?._id || !team.adminEmail) return { sent: false, reason: 'no-team' }
	const to = String(team.adminEmail).trim()
	if (!(await claim(team._id, WELCOME_KIND, to))) return { sent: false, reason: 'already-sent' }
	try {
		await sendFounderMail({ to, subject: FOUNDER_WELCOME_SUBJECT, text: buildWelcomeText(team), personal: true })
		return { sent: true }
	} catch (e) {
		await release(team._id, WELCOME_KIND)
		throw e
	}
}

/**
 * Sygnał dla twórcy: nowy zespół, kto, czy zostawił numer. Zasada „dzwonić tylko do tych, którzy zostawili numer”
 * — telefon w temacie, żeby dało się filtrować w skrzynce.
 */
async function notifyFounderNewTeam(team) {
	if (!team?._id) return { sent: false, reason: 'no-team' }
	const to = founderNotifyEmail()
	if (!(await claim(team._id, NEW_TEAM_KIND, to))) return { sent: false, reason: 'already-sent' }
	const phone = String(team.adminPhone || '').trim()
	const subject = phone ? `[Planopia] Nowy zespół: ${team.name} — ZOSTAWIŁ NUMER` : `[Planopia] Nowy zespół: ${team.name}`
	const text = [
		`Zespół: ${team.name}`,
		`Administrator: ${[team.adminFirstName, team.adminLastName].filter(Boolean).join(' ')} <${team.adminEmail}>`,
		`Telefon: ${phone || '— (nie dzwonić; czekać na odpowiedź na mail)'}`,
		`Założony: ${new Date(team.createdAt || Date.now()).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}`,
		'',
		phone ? 'Zadzwoń w najbliższy dzień roboczy (15 min wdrożenia).' : 'Bez numeru — kontakt tylko, jeśli odpisze na mail powitalny.',
	].join('\n')
	try {
		await sendFounderMail({ to, subject, text })
		return { sent: true }
	} catch (e) {
		await release(team._id, NEW_TEAM_KIND)
		throw e
	}
}

/**
 * Po rejestracji: jedno powitanie do klienta + sygnał do twórcy. Błędy nie mogą psuć rejestracji — logujemy.
 * fallbackWelcome — automatyczne powitanie, gdy osobisty mail nie wyszedł (błąd wysyłki);
 * wysłany osobisty mail zamyka też powitanie w dziennym jobie (lifecycleEmailPolicy).
 */
function onTeamRegistered(team, { fallbackWelcome } = {}) {
	const fallback = () =>
		fallbackWelcome ? Promise.resolve(fallbackWelcome()).catch(err => console.error('[founder] welcome fallback:', err.message)) : null
	sendFounderWelcome(team)
		.then(r => (!r.sent && r.reason !== 'already-sent' ? fallback() : null))
		.catch(err => {
			console.error('[founder] welcome:', err.message)
			return fallback()
		})
	notifyFounderNewTeam(team).catch(err => console.error('[founder] new-team notice:', err.message))
}

/** Baner „15 min wdrożenia z twórcą” — przez pierwsze dni po założeniu, gdy jest link do kalendarza. */
const FOUNDER_CALL_DAYS = 7
function founderCallForTeam(team, now = new Date()) {
	const url = founderCalendarUrl()
	if (!url || !team?.createdAt) return { active: false, url: null, until: null }
	const until = new Date(new Date(team.createdAt).getTime() + FOUNDER_CALL_DAYS * 86400000)
	return { active: until > now, url, until: until.toISOString() }
}

module.exports = {
	founderEmail,
	founderNotifyEmail,
	sendFounderMail,
	onTeamRegistered,
	sendFounderWelcome,
	notifyFounderNewTeam,
	founderCallForTeam,
	founderCalendarUrl,
	normalizePhone,
	buildWelcomeText,
	FOUNDER_CALL_DAYS,
}
