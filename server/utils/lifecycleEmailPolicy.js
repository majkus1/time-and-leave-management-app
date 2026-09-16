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

function inWindow(kind, ageDays) {
	const [from, to] = WINDOWS[kind]
	return ageDays >= from && ageDays <= to
}

/**
 * Jeden mail na przebieg, i to ten najpóźniejszy w cyklu — zespół, który dogania
 * po przerwie, nie dostaje trzech maili w jeden poranek. Kolejność LIFECYCLE_KINDS to
 * kolejność cyklu; wysłany późniejszy krok zamyka wcześniejsze.
 *
 * @param {{ ageDays:number, usersCount:number, paid:boolean, sentKinds?:string[] }} facts
 * @returns {string|null}
 */
function dueLifecycleKind({ ageDays, usersCount, paid, sentKinds = [] }) {
	if (!Number.isFinite(ageDays) || ageDays < 0) return null
	const sent = new Set(sentKinds)
	const lastSentIndex = LIFECYCLE_KINDS.reduce((acc, k, i) => (sent.has(k) ? i : acc), -1)

	for (let i = LIFECYCLE_KINDS.length - 1; i >= 0; i--) {
		const kind = LIFECYCLE_KINDS[i]
		if (i <= lastSentIndex) break
		if (!inWindow(kind, ageDays)) continue
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

module.exports = { LIFECYCLE_KINDS, WINDOWS, dueLifecycleKind, ownerLeadDue }
