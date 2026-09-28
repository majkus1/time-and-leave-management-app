const nodemailer = require('nodemailer')
const { firmDb } = require('../db/db')
const LifecycleEmailLog = require('../models/LifecycleEmailLog')(firmDb)
const { sendEmail } = require('./emailService')
const { publicAppUrl } = require('../config')

/**
 * Osobisty kontakt twórcy z nowym zespołem — celowo obok automatów lifecycle (inny nadawca, czysty tekst, bez szablonu).
 * Konfiguracja w .env:
 *   FOUNDER_SMTP_USER  — skrzynka Gmail twórcy (nadawca), np. michalipka1@gmail.com
 *   FOUNDER_SMTP_PASS  — hasło aplikacji Gmail (Konto Google → Bezpieczeństwo → Hasła aplikacji), nie hasło do konta
 *   FOUNDER_CALENDAR_URL — link do rezerwacji; domyślnie własna strona w aplikacji: {appUrl}/umow-rozmowe (założyciel
 *                          dostaje maile z rezerwacjami — founderCallService); zewnętrzny kalendarz tylko, gdy ustawiony
 *   FOUNDER_NAME — podpis, domyślnie „Michał Lipka”
 * Bez FOUNDER_SMTP_* mail powitalny nie wychodzi (log), a powiadomienie o nowym zespole idzie z systemowej skrzynki.
 */
const FOUNDER_EMAIL_FALLBACK = 'michalipka1@gmail.com'
const WELCOME_KIND = 'founder_welcome'
const NEW_TEAM_KIND = 'founder_new_team'

function founderEmail() {
	return (process.env.FOUNDER_SMTP_USER || FOUNDER_EMAIL_FALLBACK).trim()
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
 * Mail z skrzynki założyciela (czysty tekst, opcjonalne załączniki); bez FOUNDER_SMTP_* — z systemowej skrzynki.
 * personal=true: podpis nadawcy imieniem (odpowiedź trafia do założyciela).
 */
async function sendFounderMail({ to, subject, text, attachments = [], personal = false }) {
	if (!to) return { sent: false, reason: 'no-recipient' }
	if (isFounderSmtpConfigured()) {
		await getFounderTransporter().sendMail({
			from: personal ? `"${founderName()}" <${founderEmail()}>` : `"Planopia" <${founderEmail()}>`,
			to,
			replyTo: founderEmail(),
			subject,
			text,
			attachments,
		})
		return { sent: true, via: 'founder' }
	}
	const html = `<pre style="font-family:inherit;white-space:pre-wrap">${String(text).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>`
	await sendEmail(to, null, subject, html)
	return { sent: true, via: 'system' }
}

function isFounderSmtpConfigured() {
	return Boolean((process.env.FOUNDER_SMTP_USER || '').trim() && (process.env.FOUNDER_SMTP_PASS || '').trim())
}

let transporter = null
function getFounderTransporter() {
	if (transporter) return transporter
	const port = Number(process.env.FOUNDER_SMTP_PORT || 465)
	transporter = nodemailer.createTransport({
		host: process.env.FOUNDER_SMTP_HOST || 'smtp.gmail.com',
		port,
		secure: port === 465,
		auth: { user: process.env.FOUNDER_SMTP_USER.trim(), pass: process.env.FOUNDER_SMTP_PASS.trim() },
	})
	return transporter
}

/** Jak lifecycle: jeden mail danego rodzaju na zespół; przy błędzie SMTP wpis jest zwalniany. */
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
	const name = String(team.adminFirstName || '').trim()
	const calendar = founderCalendarUrl()
	const phone = String(team.adminPhone || '').trim()
	const lines = [
		name ? `Dzień dobry, ${name}!` : 'Dzień dobry!',
		'',
		`Dziękuję za założenie zespołu „${team.name}” w Planopii. Piszę osobiście, bo zależy mi, żeby aplikacja zadziałała u Was od pierwszego dnia — bez czytania instrukcji.`,
		'',
		`Planopia jest tutaj: ${publicAppUrl}`,
		'',
		'Jeśli to pomoże, w 15 minut ustawimy razem zespół pod Waszą firmę: pracownicy, godziny pracy i święta, urlopy, grafik albo kody QR — co jest Wam potrzebne.',
	]
	if (calendar) {
		lines.push(`Wystarczy wybrać termin: ${calendar}`)
	}
	if (phone) {
		lines.push('', `Numer ${phone} mam zapisany — zadzwonię w najbliższy dzień roboczy. Jeśli lepsza jest konkretna pora, proszę o krótką odpowiedź.`)
	}
	lines.push(
		'',
		'Można też po prostu odpisać na tę wiadomość z pytaniem — odpowiadam osobiście, zwykle tego samego dnia.',
		'',
		'Pozdrawiam serdecznie,',
		founderName(),
		'założyciel Planopii',
		founderEmail()
	)
	return lines.join('\n')
}

/** Powitanie od twórcy — czysty tekst, z jego skrzynki. Nic nie robi bez FOUNDER_SMTP_*. */
async function sendFounderWelcome(team) {
	if (!team?._id || !team.adminEmail) return { sent: false, reason: 'no-team' }
	if (!isFounderSmtpConfigured()) {
		console.info('[founder] welcome skipped: FOUNDER_SMTP_USER/PASS not set')
		return { sent: false, reason: 'not-configured' }
	}
	const to = String(team.adminEmail).trim()
	if (!(await claim(team._id, WELCOME_KIND, to))) return { sent: false, reason: 'already-sent' }
	try {
		await getFounderTransporter().sendMail({
			from: `"${founderName()}" <${founderEmail()}>`,
			to,
			replyTo: founderEmail(),
			subject: `Witam w Planopii — ${founderName().split(' ')[0]}, założyciel Planopii`,
			text: buildWelcomeText(team),
		})
		return { sent: true }
	} catch (e) {
		await release(team._id, WELCOME_KIND)
		try {
			transporter?.close?.()
		} catch (_) {}
		transporter = null
		throw e
	}
}

/**
 * Sygnał dla twórcy: nowy zespół, kto, czy zostawił numer. Zasada „dzwonić tylko do tych, którzy zostawili numer”
 * — telefon w temacie, żeby dało się filtrować w skrzynce.
 */
async function notifyFounderNewTeam(team) {
	if (!team?._id) return { sent: false, reason: 'no-team' }
	const to = founderEmail()
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
		if (isFounderSmtpConfigured()) {
			await getFounderTransporter().sendMail({ from: `"Planopia" <${founderEmail()}>`, to, subject, text })
		} else {
			await sendEmail(to, null, subject, `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>`)
		}
		return { sent: true }
	} catch (e) {
		await release(team._id, NEW_TEAM_KIND)
		throw e
	}
}

/**
 * Po rejestracji: jedno powitanie do klienta + sygnał do twórcy. Błędy nie mogą psuć rejestracji — logujemy.
 * fallbackWelcome — automatyczne powitanie, gdy osobisty mail nie wyszedł (brak FOUNDER_SMTP_*, błąd skrzynki);
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
