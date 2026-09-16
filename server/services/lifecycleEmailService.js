const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const AppSession = require('../models/AppSession')(firmDb)
const LifecycleEmailLog = require('../models/LifecycleEmailLog')(firmDb)
const { countTeamSeats } = require('./teamSeatCountService')
const { sendEmail, getEmailTemplate, escapeHtml } = require('./emailService')
const { appUrl } = require('../config')
const { dueLifecycleKind, ownerLeadDue } = require('../utils/lifecycleEmailPolicy')
const {
	SPECIAL_ELEVATED_SEAT_TEAM_NAMES,
	SPECIAL_MANUAL_BILLING_TEAM_NAMES,
	FORCE_LEGACY_PRE_BILLING_TEAM_NAMES,
	FORCE_FREEMIUM_TEST_TEAM_NAMES,
} = require('../constants/specialTeams')

const DAY_MS = 24 * 60 * 60 * 1000
const OWNER_LEAD_KIND = 'owner_lead'

/** Zespoły testowe i specjalne nie dostają maili sprzedażowych. */
function isExcludedTeam(team) {
	const name = String(team?.name || '')
	if (/^test|playwright|^e2e/i.test(name)) return true
	const email = String(team?.adminEmail || '').toLowerCase()
	if (!email.includes('@')) return true
	if (/@(test\.planopia\.pl|playwright\.com|example\.com|example\.org)$/.test(email)) return true
	return [
		...SPECIAL_ELEVATED_SEAT_TEAM_NAMES,
		...SPECIAL_MANUAL_BILLING_TEAM_NAMES,
		...FORCE_LEGACY_PRE_BILLING_TEAM_NAMES,
		...FORCE_FREEMIUM_TEST_TEAM_NAMES,
	].includes(name)
}

function ownerEmail() {
	return (process.env.LIFECYCLE_OWNER_EMAIL || process.env.EMAIL_USER || '').trim()
}

function paragraph(text) {
	return `<p style="margin:0 0 12px 0;">${text}</p>`
}

function steps(items) {
	return `<ol style="margin:0 0 16px 0; padding-left:22px;">${items
		.map(i => `<li style="margin:0 0 8px 0;">${i}</li>`)
		.join('')}</ol>`
}

/**
 * Treści po polsku, krótko i po ludzku. Każdy mail ma jeden cel i jeden przycisk.
 * @returns {{ subject:string, title:string, content:string, buttonText?:string, buttonLink?:string }}
 */
function buildLifecycleEmail(kind, team) {
	const name = escapeHtml(team.name || 'Twój zespół')
	switch (kind) {
		case 'welcome':
			return {
				subject: 'Witaj w Planopii — trzy kroki na start',
				title: `Zespół ${name} jest gotowy`,
				content:
					paragraph('Dzień dobry,') +
					paragraph('konto założone. Żeby Planopia zaczęła pracować dla zespołu, wystarczą trzy rzeczy:') +
					steps([
						'<strong>Dodaj pracowników</strong> — każdy dostaje własne konto i sam wpisuje swój czas.',
						'<strong>Ustaw godziny pracy i święta</strong> — dni wolne podpowiadają się w ewidencji.',
						'<strong>Wpisz pierwszy dzień</strong> — kliknij dzień w kalendarzu i zapisz godziny.',
					]) +
					paragraph('Przez 30 dni masz pełną aplikację za darmo, dla zespołu do 5 osób. Bez karty.') +
					paragraph('Jeśli coś jest niejasne, po prostu odpisz na tego maila — odpowiadamy osobiście.') +
					paragraph('Pozdrawiamy,<br>Zespół Planopia'),
				buttonText: 'Otwórz Planopię',
				buttonLink: appUrl,
			}
		case 'add_team':
			return {
				subject: 'Planopia działa najlepiej z zespołem',
				title: 'Na razie jesteś w zespole sam',
				content:
					paragraph('Dzień dobry,') +
					paragraph(
						`w zespole <strong>${name}</strong> jest jedno konto — Twoje. Prawdziwa oszczędność czasu zaczyna się, gdy pracownicy wpisują swój czas sami, a Ty widzisz całość w kalendarzach.`
					) +
					paragraph('Dodanie osoby to imię, nazwisko i e-mail. Pracownik dostaje link i ustawia własne hasło.') +
					paragraph('Pozdrawiamy,<br>Zespół Planopia'),
				buttonText: 'Dodaj pracowników',
				buttonLink: `${appUrl}/create-user`,
			}
		case 'leaves_tip':
			return {
				subject: 'Urlopy bez papierów — tak to działa w Planopii',
				title: 'Wniosek, akceptacja, plan urlopów',
				content:
					paragraph('Dzień dobry,') +
					paragraph('większość zespołów zaczyna od ewidencji, a zostaje dla urlopów. Jak to wygląda:') +
					steps([
						'Pracownik składa wniosek w aplikacji — z telefonu też.',
						'Przełożony akceptuje jednym kliknięciem i dostaje powiadomienie.',
						'Plan urlopów widzą wszyscy, a limity dni liczą się same.',
					]) +
					paragraph('W okresie próbnym masz to już włączone — warto sprawdzić na jednym wniosku.') +
					paragraph('Pozdrawiamy,<br>Zespół Planopia'),
				buttonText: 'Zobacz wnioski urlopowe',
				buttonLink: `${appUrl}/leave-request`,
			}
		case 'trial_ending':
			return {
				subject: 'Za tydzień kończy się okres próbny',
				title: 'Co zostaje, a co wymaga pakietu',
				content:
					paragraph('Dzień dobry,') +
					paragraph(`okres próbny zespołu <strong>${name}</strong> kończy się za 7 dni. Nic nie znika z dnia na dzień:`) +
					steps([
						'<strong>Zostaje za darmo:</strong> ewidencja czasu pracy i kalendarze dla zespołu do 5 kont.',
						'<strong>Wymaga pakietu:</strong> urlopy, grafiki, zadania, czat, asystent AI, a także zespół powyżej 5 osób.',
					]) +
					paragraph('Pakiety zaczynają się od 59 zł netto miesięcznie (do 8 osób), a rozliczenie roczne to 10 miesięcy zamiast 12.') +
					paragraph('Pozdrawiamy,<br>Zespół Planopia'),
				buttonText: 'Zobacz pakiety',
				buttonLink: `${appUrl}/packages`,
			}
		case 'trial_ended':
			return {
				subject: 'Okres próbny się zakończył — co dalej',
				title: 'Ewidencja zostaje, reszta czeka na pakiet',
				content:
					paragraph('Dzień dobry,') +
					paragraph(
						`zespół <strong>${name}</strong> jest teraz na planie darmowym: ewidencja czasu pracy i kalendarze do 5 kont, bez ograniczenia w czasie.`
					) +
					paragraph('Urlopy, grafiki, zadania, czat i asystent AI wracają w chwili wyboru pakietu — dane zespołu są na miejscu.') +
					paragraph('Pozdrawiamy,<br>Zespół Planopia'),
				buttonText: 'Wybierz pakiet',
				buttonLink: `${appUrl}/packages`,
			}
		case 'winback':
			return {
				subject: 'Czy Planopia się przydała?',
				title: 'Jedno pytanie',
				content:
					paragraph('Dzień dobry,') +
					paragraph(`kilka tygodni temu założyliście zespół <strong>${name}</strong> w Planopii. Chciałbym wiedzieć, jak Wam poszło.`) +
					paragraph('Czego zabrakło? Co było niejasne? Odpowiedź na tego maila trafia prosto do mnie — każdą czytam i odpisuję.') +
					paragraph('Pozdrawiam,<br>Michał z Planopii'),
			}
		default:
			throw new Error('Unknown lifecycle email kind: ' + kind)
	}
}

function buildOwnerLeadEmail(team, facts) {
	const name = escapeHtml(team.name || '')
	const rows = [
		['Zespół', name],
		['E-mail admina', escapeHtml(team.adminEmail || '')],
		['Dni od rejestracji', String(facts.ageDays)],
		['Aktywne konta', String(facts.usersCount)],
		['Dni z logowaniem', String(facts.sessionDays)],
		['Plan', escapeHtml(team.billingPlanKey || '—')],
	]
	return {
		subject: `Aktywny zespół na trialu: ${team.name}`,
		title: 'Zespół, do którego warto zadzwonić',
		content:
			paragraph('Ten zespół realnie używa aplikacji i jeszcze nie zapłacił.') +
			`<table style="border-collapse:collapse; margin:0 0 12px 0;">${rows
				.map(
					([k, v]) =>
						`<tr><td style="padding:4px 12px 4px 0; color:#6b7280;">${k}</td><td style="padding:4px 0; font-weight:600;">${v}</td></tr>`
				)
				.join('')}</table>`,
	}
}

async function sentKindsForTeam(teamId) {
	const logs = await LifecycleEmailLog.find({ teamId }).select('kind').lean()
	return logs.map(l => l.kind)
}

/** Zapis w dzienniku PRZED wysyłką: przy dwóch instancjach joba tylko jedna przejdzie unikalny indeks. */
async function claim(teamId, kind, to) {
	try {
		await LifecycleEmailLog.create({ teamId, kind, to })
		return true
	} catch (e) {
		if (e.code === 11000) return false
		throw e
	}
}

async function sendLifecycleEmailForTeam(team, kind) {
	if (!team || isExcludedTeam(team)) return { sent: false, reason: 'excluded' }
	const to = String(team.adminEmail || '').trim()
	if (!to) return { sent: false, reason: 'no-email' }
	if (!(await claim(team._id, kind, to))) return { sent: false, reason: 'already-sent' }
	const mail = buildLifecycleEmail(kind, team)
	const html = getEmailTemplate(mail.title, mail.content, mail.buttonText || null, mail.buttonLink || null, null)
	await sendEmail(to, null, mail.subject, html)
	return { sent: true }
}

async function sendOwnerLead(team, facts) {
	const to = ownerEmail()
	if (!to) return { sent: false, reason: 'no-owner-email' }
	if (!(await claim(team._id, OWNER_LEAD_KIND, to))) return { sent: false, reason: 'already-sent' }
	const mail = buildOwnerLeadEmail(team, facts)
	await sendEmail(to, null, mail.subject, getEmailTemplate(mail.title, mail.content, null, null, null))
	return { sent: true }
}

async function sessionDaysForTeam(teamId) {
	const starts = await AppSession.distinct('startedAt', { teamId })
	return new Set(starts.map(d => new Date(d).toISOString().slice(0, 10))).size
}

/**
 * Jeden przebieg: dla każdego żywego zespołu z ostatnich 60 dni sprawdź, co jest do wysłania.
 * dryRun zwraca plan bez wysyłania i bez zapisu — do podglądu na produkcyjnych danych.
 */
async function runLifecycleEmailsOnce({ now = new Date(), dryRun = false } = {}) {
	const since = new Date(now.getTime() - 60 * DAY_MS)
	const teams = await Team.find({
		createdAt: { $gte: since },
		isActive: { $ne: false },
		$or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
	}).lean()

	const plan = []
	for (const team of teams) {
		if (isExcludedTeam(team)) continue
		const ageDays = Math.floor((now.getTime() - new Date(team.createdAt).getTime()) / DAY_MS)
		const usersCount = await countTeamSeats(team._id)
		const paid = team.billingHadPaidPlan === true
		const sentKinds = await sentKindsForTeam(team._id)

		const kind = dueLifecycleKind({ ageDays, usersCount, paid, sentKinds })
		if (kind) plan.push({ team: team.name, to: team.adminEmail, kind, ageDays, usersCount })

		const sessionDays = await sessionDaysForTeam(team._id)
		if (ownerLeadDue({ usersCount, sessionDays, paid, alerted: sentKinds.includes(OWNER_LEAD_KIND) })) {
			plan.push({ team: team.name, to: ownerEmail(), kind: OWNER_LEAD_KIND, ageDays, usersCount, sessionDays })
		}
	}

	if (dryRun) return { dryRun: true, teamsChecked: teams.length, plan }

	const results = []
	for (const item of plan) {
		const team = teams.find(t => t.name === item.team && t.adminEmail === item.to) || teams.find(t => t.name === item.team)
		try {
			const r =
				item.kind === OWNER_LEAD_KIND
					? await sendOwnerLead(team, item)
					: await sendLifecycleEmailForTeam(team, item.kind)
			results.push({ ...item, ...r })
		} catch (e) {
			console.error('[lifecycleEmails]', item.kind, item.team, e.message)
			results.push({ ...item, sent: false, reason: 'error' })
		}
	}
	return { dryRun: false, teamsChecked: teams.length, results }
}

module.exports = {
	runLifecycleEmailsOnce,
	sendLifecycleEmailForTeam,
	buildLifecycleEmail,
	isExcludedTeam,
	OWNER_LEAD_KIND,
}
