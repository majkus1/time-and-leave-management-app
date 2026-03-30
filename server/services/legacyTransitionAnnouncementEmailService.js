/**
 * Jednorazowy / masowy mail do adminów zespołów: nowości AI, pakiety, harmonogram dostępu legacy.
 */
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const { escapeHtml, getEmailTemplate, sendEmail } = require('./emailService')
const { appUrl } = require('../config')

const EXCLUDED_TEAM_NAMES = new Set(['Halo Rental System'])
const LANDING_URL = 'https://planopia.pl'
const PACKAGES_URL = 'https://app.planopia.pl/packages'
const CENNIK_LANDING_URL = 'https://planopia.pl/#cennik'

function isValidEmail(s) {
	return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

function buildAnnouncementInnerHtml(teamName) {
	const team = escapeHtml((teamName || 'Państwa zespół').trim())
	return `
<p style="margin:0 0 16px 0;">Dzień dobry,</p>
<p style="margin:0 0 16px 0;">rozwijamy Planopię i wprowadziliśmy <strong>nowe funkcje oparte o sztuczną inteligencję</strong> — m.in. Asystenta AI i wsparcie AI w grafiku, tak aby codzienna praca zespołu była prostsza i szybsza.</p>
<p style="margin:0 0 16px 0;">W aplikacji obowiązują <strong>pakiety z limitami</strong>. Aktualne zestawienie znajdą Państwo na stronie <a href="${LANDING_URL}" style="color:#059669;font-weight:600;">planopia.pl</a> (sekcja Cennik) oraz po zalogowaniu w aplikacji: <a href="${PACKAGES_URL}" style="color:#059669;font-weight:600;">app.planopia.pl/packages</a>.</p>
<p style="margin:0 0 16px 0;">Ponieważ <strong>${team}</strong> jest z nami od dawna, na ten moment <strong>zachowujemy pełny dostęp do całej aplikacji do 1&nbsp;sierpnia&nbsp;2026&nbsp;r. (włącznie)</strong>.</p>
<p style="margin:0 0 16px 0;">Po tym terminie, bez wykupionego pakietu z cennika, dostępny będzie <strong>wąski, bezpłatny zakres</strong>: ewidencja czasu pracy w formie kalendarza <strong>dla maksymalnie 5 aktywnych użytkowników</strong> w zespole. Pełną aplikację i wyższe limity AI przywróci wybór pakietu — mogą Państwo to zrobić wcześniej w sekcji Pakiety.</p>
<p style="margin:0 0 16px 0;">W razie pytań — jesteśmy dostępni przez Centrum pomocy w aplikacji.</p>
<p style="margin:0;">Pozdrawiamy serdecznie,<br/><strong>Zespół Planopia</strong></p>
`
}

async function sendLegacyTransitionAnnouncement(toEmail, teamName) {
	if (!isValidEmail(toEmail)) {
		const err = new Error('Invalid recipient email')
		err.code = 'VALIDATION'
		throw err
	}
	const inner = buildAnnouncementInnerHtml(teamName)
	const html = getEmailTemplate(
		'Planopia — nowości, pakiety i harmonogram dostępu',
		inner,
		'Pakiety w aplikacji',
		CENNIK_LANDING_URL,
		null
	)
	await sendEmail(toEmail.trim(), appUrl, 'Planopia — nowości, pakiety i harmonogram dostępu', html)
}

/**
 * Jeden rekord e-mail → jedna wysyłka (pierwszy zespół przy zduplikowanym adminEmail).
 * Pomija Halo Rental System i nieaktywne zespoły.
 */
async function broadcastLegacyTransitionAnnouncements({ delayMs = 400 } = {}) {
	const teams = await Team.find({
		isActive: { $ne: false },
		name: { $nin: [...EXCLUDED_TEAM_NAMES] },
	})
		.select('name adminEmail')
		.lean()

	const byEmail = new Map()
	for (const t of teams) {
		const raw = (t.adminEmail || '').trim().toLowerCase()
		if (!isValidEmail(raw)) continue
		if (!byEmail.has(raw)) {
			byEmail.set(raw, t.name || 'Zespół')
		}
	}

	const delay = ms => new Promise(r => setTimeout(r, ms))
	let sent = 0
	const errors = []

	for (const [email, name] of byEmail) {
		try {
			await sendLegacyTransitionAnnouncement(email, name)
			sent += 1
			if (delayMs > 0) await delay(delayMs)
		} catch (e) {
			errors.push({ email, message: e.message || String(e) })
		}
	}

	return {
		sent,
		uniqueRecipients: byEmail.size,
		errors,
	}
}

module.exports = {
	sendLegacyTransitionAnnouncement,
	broadcastLegacyTransitionAnnouncements,
	EXCLUDED_TEAM_NAMES,
}
