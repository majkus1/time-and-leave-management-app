/**
 * Zmiana planu przy opłaconym okresie albo działającej subskrypcji kartą.
 *
 * Kupno innego planu online w takiej chwili naliczyłoby dwa plany naraz (stara subskrypcja Stripe dalej pobiera
 * opłaty i przy odnowieniu przywraca swój plan) albo przepaliłoby opłacony z góry okres P24. Dlatego online odmawiamy,
 * a zmianę przyjmujemy jako zgłoszenie mailem — opłacony okres przenosimy ręcznie.
 * Czyste funkcje (bez bazy): stan „plan opłacony” liczy wywołujący (entitlementsService.isPaidSubscriptionActive).
 */
const { SALE_PLAN_KEYS, normalizePaidPlanKey, isPaidPlanKey, isCorePlanKey, isModuleKey } = require('../constants/planCatalog')

/** Statusy subskrypcji Stripe, przy których Stripe dalej pobiera albo ponawia płatność */
const LIVE_STRIPE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid'])

/**
 * @param {{ paidActive: boolean, stripeSubscriptionId?: string|null, stripeSubscriptionStatus?: string|null }} state
 */
function planChangeNeedsRequest(state) {
	if (state?.paidActive === true) return true
	return Boolean(state?.stripeSubscriptionId) && LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(state?.stripeSubscriptionStatus)
}

/** Płatność online tylko za plany w sprzedaży — Enterprise (ponad 100 osób) to wycena indywidualna */
function onlinePurchasablePlan(planKey) {
	return SALE_PLAN_KEYS.includes(normalizePaidPlanKey(planKey))
}

function validationError(message) {
	const err = new Error(message)
	err.code = 'VALIDATION'
	return err
}

/**
 * Moduły przy ręcznej aktywacji (np. obsługa zgłoszenia „Zmiana planu”). Endpoint zapisuje dokładnie tę listę,
 * więc dla Core jest obowiązkowa (także pusta []) — brak pola kasowałby po cichu opłacone moduły.
 * @returns {string[]} lista modułów do zapisu (pusta dla pakietów)
 */
function manualActivationModuleKeys(planKey, moduleKeys) {
	// Nieznany plan zgłaszamy wprost — inaczej komunikat o modułach mylnie sugerowałby pakiet
	if (!isPaidPlanKey(planKey)) throw validationError('Nieznany plan.')
	const core = isCorePlanKey(normalizePaidPlanKey(planKey))
	if (moduleKeys === undefined || moduleKeys === null) {
		if (core) {
			throw validationError('Dla planu Core podaj moduleKeys — pełną listę modułów zespołu po aktywacji (także pustą []).')
		}
		return []
	}
	if (!Array.isArray(moduleKeys)) throw validationError('moduleKeys musi być listą.')
	if (!core && moduleKeys.length > 0) {
		throw validationError('Pakiety PRO / Business / Enterprise mają wszystkie moduły — nie podawaj moduleKeys.')
	}
	const seen = new Set()
	for (const mk of moduleKeys) {
		if (!isModuleKey(mk)) throw validationError(`Nieznany moduł: ${String(mk).slice(0, 40)}`)
		if (seen.has(mk)) throw validationError('Zduplikowany moduł na liście.')
		seen.add(mk)
	}
	return [...seen]
}

/**
 * Strażnicy ręcznej aktywacji. Webhooki ich nie potrzebują (datę i plan podaje bramka), obsługa ręczna tak:
 * data z maila bywa nieaktualna (odnowienie albo nowy zakup po zgłoszeniu), a aktywację przy działającej
 * subskrypcji Stripe nadpisałyby jej webhooki.
 * Na sucho (przed anulowaniem w Stripe) działająca subskrypcja jest oczekiwana — zgłaszamy ją jako krok do zrobienia,
 * a obecnego końca okresu nie porównujemy, bo anulowanie i tak wpisze w bazie datę anulowania.
 * @param {{ team: { billingPeriodEnd?: Date|string|null, stripeSubscriptionId?: string|null, stripeSubscriptionStatus?: string|null }, periodEnd: Date, now: Date, dryRun?: boolean }} p
 * @returns {{ conflicts: { code: string, message: string }[], stripeCancelRequired: boolean }}
 */
function manualActivationConflicts({ team, periodEnd, now, dryRun = false }) {
	const conflicts = []
	const stripeLive =
		Boolean(team?.stripeSubscriptionId) && LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(team?.stripeSubscriptionStatus)
	if (periodEnd.getTime() <= now.getTime()) {
		conflicts.push({
			code: 'PERIOD_END_IN_PAST',
			message: 'periodEnd jest w przeszłości — sprawdź aktualny koniec opłaconego okresu (Stripe albo baza).',
		})
	}
	const current = team?.billingPeriodEnd ? new Date(team.billingPeriodEnd) : null
	const currentValid = current && !Number.isNaN(current.getTime())
	if (!(dryRun && stripeLive) && currentValid && current > now && periodEnd < current) {
		conflicts.push({
			code: 'PERIOD_END_SHORTENS_PAID',
			message: `periodEnd skraca opłacony okres (teraz do ${current.toISOString()}).`,
		})
	}
	if (stripeLive && !dryRun) {
		conflicts.push({
			code: 'STRIPE_SUBSCRIPTION_LIVE',
			message: `Subskrypcja Stripe ${team.stripeSubscriptionId} działa (${team.stripeSubscriptionStatus}) — najpierw anuluj ją w panelu Stripe i poczekaj na customer.subscription.deleted.`,
		})
	}
	return { conflicts, stripeCancelRequired: stripeLive }
}

module.exports = {
	planChangeNeedsRequest,
	onlinePurchasablePlan,
	manualActivationModuleKeys,
	manualActivationConflicts,
	LIVE_STRIPE_SUBSCRIPTION_STATUSES,
}
