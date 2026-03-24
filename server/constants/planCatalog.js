/**
 * Single source of truth for paid plan limits (app + admin activation + future payment webhooks).
 * Marketing copy on the landing may differ in wording but should match these numbers.
 */

const TRIAL = {
	maxUsers: 5,
	/** One-off pool during active trial window */
	aiTrialOneOffTotal: 10,
}

/**
 * Zespoły bez pól billing w Mongo (konta sprzed cennika) mają pełny dostęp do aplikacji bez subskrypcji
 * do tego momentu — północ przejścia na 2.01.2027 w Europe/Warsaw.
 * Nie dotyczy OficjalnyAdminowy / Halo Rental System (osobna obsługa, nie są „structural legacy”).
 */
const LEGACY_PRE_BILLING_GRACE_UNTIL = new Date('2027-01-02T00:00:00+01:00')

const PAID_PLANS = {
	starter: {
		maxUsers: 10,
		aiMessagesPerMonth: 10,
	},
	pro: {
		maxUsers: 30,
		aiMessagesPerMonth: 50,
	},
	business: {
		maxUsers: 100,
		aiMessagesPerMonth: 300,
	},
	enterprise: {
		maxUsers: 300,
		aiMessagesPerMonth: 1000,
	},
}

const AI_ADDON_PACKS = {
	ai50: { messages: 50, pricePlnNet: 19 },
	ai200: { messages: 200, pricePlnNet: 49 },
	ai500: { messages: 500, pricePlnNet: 99 },
}

const PAID_PLAN_KEYS = Object.keys(PAID_PLANS)

const MONTHLY_NET_PRICES_PLN = {
	starter: 99,
	pro: 199,
	business: 399,
	enterprise: 799,
}

function listAddonIds() {
	return Object.keys(AI_ADDON_PACKS)
}

function listPaidPlanKeys() {
	return [...PAID_PLAN_KEYS]
}

function isPaidPlanKey(key) {
	return PAID_PLAN_KEYS.includes(key)
}

function isAddonId(id) {
	return Object.prototype.hasOwnProperty.call(AI_ADDON_PACKS, id)
}

module.exports = {
	TRIAL,
	LEGACY_PRE_BILLING_GRACE_UNTIL,
	PAID_PLANS,
	AI_ADDON_PACKS,
	PAID_PLAN_KEYS,
	MONTHLY_NET_PRICES_PLN,
	listAddonIds,
	listPaidPlanKeys,
	isPaidPlanKey,
	isAddonId,
}
