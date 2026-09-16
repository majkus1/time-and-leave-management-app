/**
 * Kiedy który mail cyklu życia jest „do wysłania”. Czysta logika, bez bazy — testowana osobno.
 *
 * Okna są szerokie (kilka dni), żeby awaria joba przez dzień czy dwa nie gubiła maila;
 * przed dublem chroni dziennik wysyłek (LifecycleEmailLog, unikalny teamId + kind).
 */

const LIFECYCLE_KINDS = ['welcome', 'add_team', 'leaves_tip', 'trial_ending', 'trial_ended', 'winback']

/** [od, do] w dniach od rejestracji, włącznie. */
const WINDOWS = {
	welcome: [0, 3],
	add_team: [2, 6],
	leaves_tip: [7, 12],
	trial_ending: [23, 28],
	trial_ended: [30, 36],
	winback: [40, 50],
}

/**
 * Kroki o końcu trialu liczymy z faktycznej daty jego końca, jeśli ją znamy — ręcznie
 * przedłużony trial nie może dostać „kończy się za 7 dni” w 23. dniu od rejestracji.
 * Bez tej daty (null) wracamy do okien liczonych od rejestracji.
 */
const TRIAL_WINDOWS = {
	trial_ending: [4, 8],
	trial_ended: [-7, 0],
}

function inWindow(kind, ageDays, trialDaysLeft) {
	if (TRIAL_WINDOWS[kind] && Number.isFinite(trialDaysLeft)) {
		const [from, to] = TRIAL_WINDOWS[kind]
		return trialDaysLeft >= from && trialDaysLeft <= to
	}
	const [from, to] = WINDOWS[kind]
	return ageDays >= from && ageDays <= to
}

/**
 * Jeden mail na przebieg, i to ten najpóźniejszy w cyklu — zespół, który dogania
 * po przerwie, nie dostaje trzech maili w jeden poranek. Kolejność LIFECYCLE_KINDS to
 * kolejność cyklu; wysłany późniejszy krok zamyka wcześniejsze.
 *
 * @param {{ ageDays:number, usersCount:number, paid:boolean, sentKinds?:string[], trialDaysLeft?:number|null }} facts
 * @returns {string|null}
 */
function dueLifecycleKind({ ageDays, usersCount, paid, sentKinds = [], trialDaysLeft = null }) {
	if (!Number.isFinite(ageDays) || ageDays < 0) return null
	const sent = new Set(sentKinds)
	const lastSentIndex = LIFECYCLE_KINDS.reduce((acc, k, i) => (sent.has(k) ? i : acc), -1)

	for (let i = LIFECYCLE_KINDS.length - 1; i >= 0; i--) {
		const kind = LIFECYCLE_KINDS[i]
		if (i <= lastSentIndex) break
		if (!inWindow(kind, ageDays, trialDaysLeft)) continue
		if (kind !== 'welcome' && paid) continue
		if (kind === 'add_team' && usersCount > 1) continue
		return kind
	}
	return null
}

/**
 * Sygnał dla właściciela: zespół, który realnie zaczął używać aplikacji, a nie zapłacił —
 * warto zadzwonić. Raz na zespół.
 */
function ownerLeadDue({ usersCount, sessionDays, paid, alerted }) {
	if (paid || alerted) return false
	return usersCount >= 3 || sessionDays >= 3
}

/**
 * Maile wokół opłaconego pakietu. Rodzaj ma w sobie datę końca okresu, więc każde
 * odnowienie dostaje własny komplet przypomnień, a dziennik nadal chroni przed dublem.
 *
 * Przypomnienia przed końcem — tylko płatności jednorazowe (P24); subskrypcja Stripe
 * odnawia się sama i takie przypomnienie byłoby mylące. Mail o wygaśnięciu — każdy.
 *
 * @param {{ daysToEnd:number, hasStripeSubscription:boolean, active:boolean, lapsed:boolean, periodEndKey:string, sentKinds?:string[] }} facts
 * @returns {string|null}
 */
function dueBillingKind({ daysToEnd, hasStripeSubscription, active, lapsed, periodEndKey, sentKinds = [] }) {
	if (!Number.isFinite(daysToEnd) || !periodEndKey) return null
	const sent = new Set(sentKinds)
	const pick = kind => (sent.has(kind) ? null : kind)

	if (lapsed && daysToEnd >= -7 && daysToEnd <= -1) return pick(`paid_lapsed:${periodEndKey}`)
	if (!active || hasStripeSubscription) return null
	if (daysToEnd >= 0 && daysToEnd <= 1) return pick(`paid_renewal_1d:${periodEndKey}`)
	if (daysToEnd >= 5 && daysToEnd <= 8) return pick(`paid_renewal_7d:${periodEndKey}`)
	return null
}

module.exports = { LIFECYCLE_KINDS, WINDOWS, TRIAL_WINDOWS, dueLifecycleKind, dueBillingKind, ownerLeadDue }
