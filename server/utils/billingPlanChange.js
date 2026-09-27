/**
 * Zmiana planu przy opłaconym okresie albo działającej subskrypcji kartą.
 *
 * Kupno innego planu online w takiej chwili naliczyłoby dwa plany naraz (stara subskrypcja Stripe dalej pobiera
 * opłaty i przy odnowieniu przywraca swój plan) albo przepaliłoby opłacony z góry okres P24. Dlatego online odmawiamy,
 * a zmianę przyjmujemy jako zgłoszenie mailem — opłacony okres przenosimy ręcznie.
 * Czysta funkcja (bez bazy): stan „plan opłacony” liczy wywołujący (entitlementsService.isPaidSubscriptionActive).
 */

/** Statusy subskrypcji Stripe, przy których Stripe dalej pobiera albo ponawia płatność */
const LIVE_STRIPE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid'])

/**
 * @param {{ paidActive: boolean, stripeSubscriptionId?: string|null, stripeSubscriptionStatus?: string|null }} state
 */
function planChangeNeedsRequest(state) {
	if (state?.paidActive === true) return true
	return Boolean(state?.stripeSubscriptionId) && LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(state?.stripeSubscriptionStatus)
}

module.exports = { planChangeNeedsRequest, LIVE_STRIPE_SUBSCRIPTION_STATUSES }
