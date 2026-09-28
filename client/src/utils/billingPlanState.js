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

const PAST_DUE_STRIPE_STATUSES = new Set(['past_due', 'unpaid'])

/**
 * Karta odrzucona, a karencja już minęła: Stripe dalej ponawia płatność, zespół jest na planie darmowym. Płatność online
 * zostaje zablokowana (Stripe mógłby pobrać drugi raz), ale to nie „aktywny plan” — potrzebny inny komunikat.
 * W karencji (koniec okresu w przyszłości) plan jeszcze działa i obowiązują zwykłe teksty.
 * Bliźniak serwera: planChangeBlockReason === 'card_retry' w server/utils/billingPlanChange.js.
 */
export function cardPaymentSuspended(ent, now = new Date()) {
	if (!ent?.stripe?.subscriptionId || !PAST_DUE_STRIPE_STATUSES.has(ent.stripe.subscriptionStatus)) return false
	const end = ent.billingPeriodEnd ? new Date(ent.billingPeriodEnd) : null
	return !end || Number.isNaN(end.getTime()) || end <= now
}

function liveStripeSubscription(ent) {
	return Boolean(ent?.stripe?.subscriptionId) && LIVE_STRIPE_SUBSCRIPTION_STATUSES.has(ent?.stripe?.subscriptionStatus)
}

/**
 * „Przedłuż plan” BLIK / przelewem: plan w sprzedaży z datą końca, bez działającej subskrypcji kartą (ta odnawia
 * się sama) i bez rozliczenia osobnego (ukryta data, np. faktura). Przed końcem okresu nowy okres zacznie się
 * po obecnym, po wygaśnięciu — od płatności. Bliźniak serwera: isEarlyRenewal / renewalFinalizeDecision
 * w server/utils/billingPlanChange.js.
 * @returns {{ planKey: string, periodEnd: Date, active: boolean } | null}
 */
export function renewalOffer(ent, catalog, now = new Date()) {
	if (!ent?.planKey || !ent.billingPeriodEnd || ent.hideBillingPeriodEnd) return null
	if (liveStripeSubscription(ent)) return null
	const saleIds = new Set([...(catalog?.coreTiers || []), ...(catalog?.bundles || [])].map(t => t.id))
	if (!saleIds.has(ent.planKey)) return null
	const periodEnd = new Date(ent.billingPeriodEnd)
	if (Number.isNaN(periodEnd.getTime())) return null
	return { planKey: ent.planKey, periodEnd, active: ent.billingStatus === 'active' && periodEnd > now }
}

/**
 * Opłacony plan albo działająca subskrypcja kartą (także ponawianie płatności po odrzuceniu karty):
 * zmiana planu i dodanie modułu tylko prośbą mailem — drugi plan online naliczyłby się obok starego.
 */
export function planChangeByRequest(ent, paidPlanIds, now = new Date()) {
	if (!ent) return false
	if (paidSubscriptionActive(ent, paidPlanIds, now)) return true
	return liveStripeSubscription(ent)
}
