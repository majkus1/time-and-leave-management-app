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
 * do tego momentu — pierwsza chwila PO 1.08.2026 (Europe/Warsaw), tj. 2.08.2026 00:00 w tej strefie.
 * Nie dotyczy OficjalnyAdminowy / Halo Rental System (osobna obsługa, nie są „structural legacy”).
 */
const LEGACY_PRE_BILLING_GRACE_UNTIL = new Date('2026-08-02T00:00:00+02:00')

/** Jednorazowa pula AI (czat + grafik + drafty) na cały okres legacy — bez resetu miesięcznego. */
const LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL = 10

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
	/** Tymczasowo 1 PLN — test cyklu Stripe na prod; przywróć 119 przed normalnym ruchem. */
	starter: 1,
	pro: 239,
	business: 479,
	enterprise: 949,
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

/** Zgodnie z UI (PackagesPage): rocznie = 10× cena miesięczna netto, dostęp 12 mies. */
const ANNUAL_NET_MONTHS_CHARGED = 10

/**
 * Kwota do pobrania przez P24 (grosze). Ceny katalogowe to PLN netto; przy zwolnieniu z VAT = kwota końcowa.
 * @param {'monthly'|'annual'} billingCycle
 */
function checkoutAmountGroszeForPlan(planKey, billingCycle) {
	if (!isPaidPlanKey(planKey)) {
		throw new Error('Invalid plan key')
	}
	const monthlyNet = MONTHLY_NET_PRICES_PLN[planKey]
	const netPln =
		billingCycle === 'annual' ? monthlyNet * ANNUAL_NET_MONTHS_CHARGED : monthlyNet
	return Math.round(netPln * 100)
}

function checkoutAmountGroszeForAddon(addonId) {
	if (!isAddonId(addonId)) {
		throw new Error('Invalid addon id')
	}
	return Math.round(AI_ADDON_PACKS[addonId].pricePlnNet * 100)
}

module.exports = {
	TRIAL,
	LEGACY_PRE_BILLING_GRACE_UNTIL,
	LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL,
	PAID_PLANS,
	AI_ADDON_PACKS,
	PAID_PLAN_KEYS,
	MONTHLY_NET_PRICES_PLN,
	listAddonIds,
	listPaidPlanKeys,
	isPaidPlanKey,
	isAddonId,
	ANNUAL_NET_MONTHS_CHARGED,
	checkoutAmountGroszeForPlan,
	checkoutAmountGroszeForAddon,
}
