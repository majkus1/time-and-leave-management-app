const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const AppSession = require('../models/AppSession')(firmDb)
const LifecycleEmailLog = require('../models/LifecycleEmailLog')(firmDb)
const { countTeamSeats } = require('./teamSeatCountService')
const { sendEmail, getEmailTemplate, escapeHtml } = require('./emailService')
const { appUrl } = require('../config')
const { dueLifecycleKind, dueBillingKind, ownerLeadDue } = require('../utils/lifecycleEmailPolicy')
const entitlementsService = require('./entitlementsService')
const { normalizePaidPlanKey } = require('../constants/planCatalog')
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
	// „Test”, „test-2”, „TEST freemium…” — tak; „Testa Sp. z o.o.” — nie.
	if (/^(test|testy|testowy|e2e)(\b|[\d_-])|playwright/i.test(name)) return true
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
 * Treści po polsku, uprzejmie (forma „Państwo”), krótko. Każdy mail ma jeden cel i jeden przycisk.
 * @returns {{ subject:string, title:string, content:string, buttonText?:string, buttonLink?:string }}
 */
function buildLifecycleEmail(kind, team, facts = {}) {
	const name = escapeHtml(team.name || 'Państwa zespół')
	const daysLeft = Number.isFinite(facts.trialDaysLeft) ? facts.trialDaysLeft : 7
	const daysLeftText = daysLeft <= 1 ? 'jutro' : `za ${daysLeft} dni`
	switch (kind) {
		case 'welcome':
			return {
				subject: 'Witamy w Planopii — trzy kroki na start',
				title: `Zespół ${name} jest gotowy`,
				content:
					paragraph('Szanowni Państwo,') +
					paragraph('dziękujemy za założenie zespołu w Planopii. Aby aplikacja zaczęła pracować dla Państwa, wystarczą trzy kroki:') +
					steps([
						'<strong>Dodanie pracowników</strong> — każdy otrzymuje własne konto i sam wpisuje swój czas pracy.',
						'<strong>Ustawienie godzin pracy i świąt</strong> — dni wolne podpowiadają się w ewidencji automatycznie.',
						'<strong>Pierwszy wpis</strong> — wystarczy kliknąć dzień w kalendarzu i zapisać godziny.',
					]) +
					paragraph('Przez 30 dni mają Państwo do dyspozycji pełną aplikację bezpłatnie, dla zespołu do 5 osób. Bez podawania karty.') +
					paragraph('W razie pytań wystarczy odpowiedzieć na tę wiadomość — odpowiadamy osobiście.') +
					paragraph('Z poważaniem,<br>Zespół Planopia'),
				buttonText: 'Otwórz Planopię',
				buttonLink: appUrl,
			}
		case 'add_team':
			return {
				subject: 'Planopia działa najlepiej z całym zespołem',
				title: 'W zespole jest na razie jedno konto',
				content:
					paragraph('Szanowni Państwo,') +
					paragraph(
						`w zespole <strong>${name}</strong> jest obecnie jedno konto — administratora. Największa oszczędność czasu zaczyna się, gdy pracownicy wpisują swój czas samodzielnie, a Państwo widzą całość w kalendarzach.`
					) +
					paragraph('Dodanie osoby wymaga tylko imienia, nazwiska i adresu e-mail. Pracownik otrzymuje link i sam ustawia hasło.') +
					paragraph('Z poważaniem,<br>Zespół Planopia'),
				buttonText: 'Dodaj pracowników',
				buttonLink: `${appUrl}/create-user`,
			}
		case 'leaves_tip':
			return {
				subject: 'Urlopy bez papierów — jak to działa w Planopii',
				title: 'Wniosek, akceptacja, plan urlopów',
				content:
					paragraph('Szanowni Państwo,') +
					paragraph('większość zespołów zaczyna od ewidencji czasu pracy, a zostaje dla obsługi urlopów. Jak to wygląda w praktyce:') +
					steps([
						'Pracownik składa wniosek w aplikacji — również z telefonu.',
						'Przełożony akceptuje go jednym kliknięciem i otrzymuje powiadomienie.',
						'Plan urlopów widzi cały zespół, a pule dni rozliczają się automatycznie.',
					]) +
					paragraph('W okresie próbnym ta funkcja jest już włączona — warto sprawdzić ją na jednym wniosku.') +
					paragraph('Z poważaniem,<br>Zespół Planopia'),
				buttonText: 'Zobacz wnioski urlopowe',
				buttonLink: `${appUrl}/leave-request`,
			}
		case 'trial_ending':
			return {
				subject: daysLeft <= 1 ? 'Jutro kończy się okres próbny' : `Za ${daysLeft} dni kończy się okres próbny`,
				title: 'Co pozostaje, a co wymaga pakietu',
				content:
					paragraph('Szanowni Państwo,') +
					paragraph(`okres próbny zespołu <strong>${name}</strong> kończy się ${daysLeftText}. Nic nie znika z dnia na dzień:`) +
					steps([
						'<strong>Pozostaje bezpłatnie:</strong> ewidencja czasu pracy i kalendarze dla zespołu do 5 kont.',
						'<strong>Wymaga pakietu:</strong> urlopy, grafiki, zadania, czat, asystent AI oraz zespół powyżej 5 osób.',
					]) +
					paragraph('Pakiety zaczynają się od 119 zł netto miesięcznie, a przy rozliczeniu rocznym płacą Państwo za 10 miesięcy zamiast 12.') +
					paragraph('Z poważaniem,<br>Zespół Planopia'),
				buttonText: 'Zobacz pakiety',
				buttonLink: `${appUrl}/packages`,
			}
		case 'trial_ended':
			return {
				subject: 'Okres próbny się zakończył — co dalej',
				title: 'Ewidencja pozostaje, pozostałe moduły czekają na pakiet',
				content:
					paragraph('Szanowni Państwo,') +
					paragraph(
						`zespół <strong>${name}</strong> korzysta teraz z planu darmowego: ewidencja czasu pracy i kalendarze do 5 kont, bez ograniczenia w czasie.`
					) +
					paragraph('Urlopy, grafiki, zadania, czat i asystent AI zostaną przywrócone z chwilą wyboru pakietu — wszystkie dane zespołu są zachowane.') +
					paragraph('Z poważaniem,<br>Zespół Planopia'),
				buttonText: 'Wybierz pakiet',
				buttonLink: `${appUrl}/packages`,
			}
		case 'winback':
			return {
				subject: 'Czy Planopia okazała się przydatna?',
				title: 'Jedno pytanie',
				content:
					paragraph('Szanowni Państwo,') +
					paragraph(`kilka tygodni temu założyli Państwo zespół <strong>${name}</strong> w Planopii. Chciałbym zapytać, jak się sprawdziła.`) +
					paragraph('Czego zabrakło? Co było niejasne? Odpowiedź na tę wiadomość trafia bezpośrednio do mnie — każdą czytam i odpisuję.') +
					paragraph('Z poważaniem,<br>Michał Lipka, Planopia'),
			}
		default:
			throw new Error('Unknown lifecycle email kind: ' + kind)
	}
}

const PLAN_LABELS = {
	base_s: 'Core (do 15 osób)',
	base_m: 'Core (do 30 osób)',
	base_l: 'Core (do 100 osób)',
	pro: 'PRO',
	business: 'Business',
	enterprise: 'Enterprise',
}

function planLabel(planKey) {
	const nk = normalizePaidPlanKey(planKey)
	return PLAN_LABELS[nk] || String(planKey || 'pakiet')
}

function formatDatePl(value) {
	if (!value) return '—'
	return new Date(value).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' })
}

function cycleLabel(billingCycle) {
	return billingCycle === 'annual' ? 'rozliczenie roczne' : 'rozliczenie miesięczne'
}

const KSEF_LINE =
	'Fakturę wystawimy w <strong>KSeF</strong> (Krajowym Systemie e-Faktur) i prześlemy na ten adres e-mail w ciągu kilku dni.'

/**
 * Potwierdzenie po udanej płatności (P24 i Stripe): co kupiono, do kiedy dostęp, faktura w KSeF.
 * Pierwszy zakup i odnowienie mają inny ton, ale tę samą treść rzeczową.
 */
function buildPaymentConfirmationEmail(team, { planKey, billingCycle, periodEnd, isFirst }) {
	const name = escapeHtml(team.name || 'Państwa zespół')
	const label = escapeHtml(planLabel(planKey))
	const until = formatDatePl(periodEnd)
	return {
		subject: isFirst ? 'Potwierdzenie zakupu — Planopia' : 'Potwierdzenie odnowienia pakietu — Planopia',
		title: isFirst ? 'Dziękujemy za wybór Planopii' : 'Pakiet został odnowiony',
		content:
			paragraph('Szanowni Państwo,') +
			paragraph(
				isFirst
					? `otrzymaliśmy płatność za pakiet <strong>${label}</strong> (${cycleLabel(billingCycle)}) dla zespołu <strong>${name}</strong>. Wszystkie funkcje pakietu są już aktywne — dostęp obowiązuje do <strong>${until}</strong>.`
					: `pakiet <strong>${label}</strong> (${cycleLabel(billingCycle)}) zespołu <strong>${name}</strong> został odnowiony. Dostęp obowiązuje do <strong>${until}</strong>.`
			) +
			paragraph(KSEF_LINE) +
			paragraph('W razie pytań prosimy o odpowiedź na tę wiadomość lub kontakt przez Centrum pomocy w aplikacji.') +
			paragraph('Z poważaniem,<br>Zespół Planopia'),
		buttonText: 'Otwórz Planopię',
		buttonLink: appUrl,
	}
}

/** Maile wokół końca opłaconego okresu — rodzaje z lifecycleEmailPolicy.dueBillingKind. */
function buildBillingEmail(kind, team, facts = {}) {
	const name = escapeHtml(team.name || 'Państwa zespół')
	const label = escapeHtml(planLabel(team.billingPlanKey))
	const until = formatDatePl(team.billingPeriodEnd)
	const base = kind.split(':')[0]
	const daysToEnd = Number.isFinite(facts.daysToEnd) ? facts.daysToEnd : null
	const manyAccounts = Number.isFinite(facts.usersCount) && facts.usersCount > 5

	if (base === 'paid_renewal_7d' || base === 'paid_renewal_1d') {
		const when = daysToEnd != null && daysToEnd <= 1 ? 'jutro' : `za ${daysToEnd} dni`
		return {
			subject: daysToEnd != null && daysToEnd <= 1 ? `Pakiet ${planLabel(team.billingPlanKey)} wygasa jutro` : `Pakiet ${planLabel(team.billingPlanKey)} wygasa ${when}`,
			title: 'Przedłużenie pakietu zachowa pełny dostęp',
			content:
				paragraph('Szanowni Państwo,') +
				paragraph(
					`pakiet <strong>${label}</strong> zespołu <strong>${name}</strong> jest opłacony do <strong>${until}</strong>. Płatność BLIK / przelewem jest jednorazowa i nie odnawia się automatycznie.`
				) +
				paragraph(
					'Po tym dniu zespół przejdzie na plan darmowy: pozostanie ewidencja czasu pracy do 5 kont, a urlopy, grafiki, zadania, czat i asystent AI będą dostępne ponownie po przedłużeniu. Dane zespołu pozostają nienaruszone.'
				) +
				(manyAccounts
					? paragraph('Zespół ma więcej niż 5 kont — bez przedłużenia z aplikacji będą mogli korzystać wyłącznie administrator i HR, do czasu opłacenia pakietu lub zmniejszenia liczby kont.')
					: '') +
				paragraph('Z poważaniem,<br>Zespół Planopia'),
			buttonText: 'Przedłuż pakiet',
			buttonLink: `${appUrl}/packages`,
		}
	}
	if (base === 'paid_lapsed') {
		return {
			subject: 'Pakiet wygasł — zespół korzysta z planu darmowego',
			title: 'Dostęp ograniczony do ewidencji czasu pracy',
			content:
				paragraph('Szanowni Państwo,') +
				paragraph(`pakiet <strong>${label}</strong> zespołu <strong>${name}</strong> wygasł <strong>${until}</strong> i nie został przedłużony.`) +
				paragraph(
					'Dane zespołu są zachowane. Urlopy, grafiki, zadania, czat i asystent AI zostaną przywrócone z chwilą wyboru pakietu — bez ponownej konfiguracji.'
				) +
				(manyAccounts
					? paragraph('Zespół ma więcej niż 5 kont, dlatego do czasu przedłużenia z aplikacji korzystają wyłącznie administrator i HR.')
					: '') +
				paragraph('Z poważaniem,<br>Zespół Planopia'),
			buttonText: 'Wybierz pakiet',
			buttonLink: `${appUrl}/packages`,
		}
	}
	throw new Error('Unknown billing email kind: ' + kind)
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

/**
 * Wysyłka pod ochroną dziennika. Gdy SMTP odrzuci, wpis jest zwalniany — inaczej mail
 * „zajęty, ale niewysłany” przepadałby na zawsze, a późniejszy krok cyklu zamykałby wcześniejsze.
 */
async function sendClaimed(teamId, kind, to, subject, html) {
	if (!(await claim(teamId, kind, to))) return { sent: false, reason: 'already-sent' }
	try {
		await sendEmail(to, null, subject, html)
	} catch (e) {
		await LifecycleEmailLog.deleteOne({ teamId, kind }).catch(() => {})
		throw e
	}
	return { sent: true }
}

async function sendLifecycleEmailForTeam(team, kind, facts = {}) {
	if (!team || isExcludedTeam(team)) return { sent: false, reason: 'excluded' }
	const to = String(team.adminEmail || '').trim()
	if (!to) return { sent: false, reason: 'no-email' }
	const mail = kind.startsWith('paid_') ? buildBillingEmail(kind, team, facts) : buildLifecycleEmail(kind, team, facts)
	const html = getEmailTemplate(mail.title, mail.content, mail.buttonText || null, mail.buttonLink || null, null)
	return sendClaimed(team._id, kind, to, mail.subject, html)
}

/**
 * Po aktywacji opłaconego planu (wywoływane z billingActivationService). Klucz w dzienniku
 * to klucz idempotencji aktywacji — jedna płatność, jeden mail, także przy powtórzonym webhooku.
 */
async function sendPaymentConfirmationForTeam(team, { planKey, billingCycle, periodEnd, isFirst, idempotencyKey }) {
	if (!team || isExcludedTeam(team)) return { sent: false, reason: 'excluded' }
	const to = String(team.adminEmail || '').trim()
	if (!to) return { sent: false, reason: 'no-email' }
	const mail = buildPaymentConfirmationEmail(team, { planKey, billingCycle, periodEnd, isFirst })
	const html = getEmailTemplate(mail.title, mail.content, mail.buttonText, mail.buttonLink, null)
	return sendClaimed(team._id, `paid_confirm:${idempotencyKey}`, to, mail.subject, html)
}

async function sendOwnerLead(team, facts) {
	const to = ownerEmail()
	if (!to) return { sent: false, reason: 'no-owner-email' }
	const mail = buildOwnerLeadEmail(team, facts)
	return sendClaimed(team._id, OWNER_LEAD_KIND, to, mail.subject, getEmailTemplate(mail.title, mail.content, null, null, null))
}

/** Dni do końca trialu wg faktycznej daty (ręczne przedłużenie też się liczy); null, gdy nie ma trialu. */
function trialDaysLeftFor(team, now) {
	if (team.billingPlanKey !== 'trial' || !team.trialEndsAt) return null
	return Math.ceil((new Date(team.trialEndsAt).getTime() - now.getTime()) / DAY_MS)
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
		const trialDaysLeft = trialDaysLeftFor(team, now)

		const kind = dueLifecycleKind({ ageDays, usersCount, paid, sentKinds, trialDaysLeft })
		if (kind) plan.push({ team: team.name, to: team.adminEmail, kind, ageDays, usersCount, trialDaysLeft })

		const sessionDays = await sessionDaysForTeam(team._id)
		if (ownerLeadDue({ usersCount, sessionDays, paid, alerted: sentKinds.includes(OWNER_LEAD_KIND) })) {
			plan.push({ team: team.name, to: ownerEmail(), kind: OWNER_LEAD_KIND, ageDays, usersCount, sessionDays })
		}
	}

	// Opłacone pakiety wokół końca okresu (±8 dni) — niezależnie od wieku zespołu.
	const paidTeams = await Team.find({
		billingPeriodEnd: { $gte: new Date(now.getTime() - 8 * DAY_MS), $lte: new Date(now.getTime() + 8 * DAY_MS) },
		isActive: { $ne: false },
		$or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
	}).lean()
	for (const team of paidTeams) {
		if (isExcludedTeam(team)) continue
		const end = new Date(team.billingPeriodEnd)
		const kind = dueBillingKind({
			daysToEnd: Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
			hasStripeSubscription: Boolean(team.stripeSubscriptionId),
			active: entitlementsService.isPaidSubscriptionActive(team, now),
			lapsed: entitlementsService.isPaidPlanPeriodLapsed(team, now),
			periodEndKey: end.toISOString().slice(0, 10),
			sentKinds: await sentKindsForTeam(team._id),
		})
		if (!kind) continue
		plan.push({
			team: team.name,
			to: team.adminEmail,
			kind,
			daysToEnd: Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
			usersCount: await countTeamSeats(team._id),
			teamId: String(team._id),
		})
	}

	if (dryRun) return { dryRun: true, teamsChecked: teams.length + paidTeams.length, plan }

	const allTeams = [...teams, ...paidTeams]
	const results = []
	for (const item of plan) {
		const team =
			(item.teamId && allTeams.find(t => String(t._id) === item.teamId)) ||
			allTeams.find(t => t.name === item.team && t.adminEmail === item.to) ||
			allTeams.find(t => t.name === item.team)
		try {
			const r =
				item.kind === OWNER_LEAD_KIND
					? await sendOwnerLead(team, item)
					: await sendLifecycleEmailForTeam(team, item.kind, item)
			results.push({ ...item, ...r })
		} catch (e) {
			console.error('[lifecycleEmails]', item.kind, item.team, e.message)
			results.push({ ...item, sent: false, reason: 'error' })
		}
	}
	return { dryRun: false, teamsChecked: allTeams.length, results }
}

module.exports = {
	runLifecycleEmailsOnce,
	sendLifecycleEmailForTeam,
	sendPaymentConfirmationForTeam,
	buildLifecycleEmail,
	buildBillingEmail,
	buildPaymentConfirmationEmail,
	isExcludedTeam,
	OWNER_LEAD_KIND,
}
