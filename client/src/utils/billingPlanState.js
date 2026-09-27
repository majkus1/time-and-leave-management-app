// utils/billingPlanState.js
//
// Stan planu zespołu w Pakietach: czy plan jest opłacony i czy zmiana planu idzie tylko zgłoszeniem.
//
// Bliźniak reguły serwera: server/utils/billingPlanChange.js (planChangeNeedsRequest). Serwer i tak odmówi
// płatności online kodem PLAN_CHANGE_REQUIRES_REQUEST — tutaj chodzi o to, żeby klient w ogóle nie trafił na płatność.

const LIVE_STRIPE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid'])

/** Płatne plany z katalogu API (także nowe progi base_5, pro_15…) — bez listy wpisanej na sztywno */
export function paidPlanIdsFromCatalog(catalog) {
	return new Set([...(catalog?.tiers || []).map(t => t.id), 'starter'])
}

export function paidSubscriptionActive(ent, paidPlanIds, now = new Date()) {
	if (!ent?.planKey || ent.billingStatus !== 'active') return false
	if (!paidPlanIds.has(ent.planKey)) return false
	if (ent.billingPeriodEnd && new Date(ent.billingPeriodEnd) < now) return false
	return true
}

/**
 * Opłacony plan albo działająca subskrypcja kartą (także ponawianie płatności po odrzuceniu karty):
 * zmiana planu i dodanie modułu tylko prośbą mailem — drugi plan online naliczyłby się obok starego.
 */
export function planChangeByRequest(ent, paidPlanIds, now = new Date()) {
	if (!ent) return false
	if (paidSubscriptionActive(ent, paidPlanIds, now)) return true
	return Boolean(ent.stripe?.subscriptionId) && LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(ent.stripe?.subscriptionStatus)
}
