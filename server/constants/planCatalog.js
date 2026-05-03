/**
 * Cennik Planopia — single source of truth (apka, aktywacja, webhooks).
 *
 * Produkt „Core”: jedna linia produktowa z trzema rozmiarami zespołu + moduły opcjonalne.
 * Identyfikatory techniczne w kodzie / Stripe / Mongo: `base_s` (≤15), `base_m` (≤30), `base_l` (≤100).
 * Pakiety PRO / BUSINESS / ENTERPRISE: wszystkie moduły w cenie (`pro`, `business`, `enterprise`).
 * Klucz `starter` w Mongo = alias legacy → normalizuj do `base_s`.
 */

const TRIAL = {
	maxUsers: 5,
	aiTrialOneOffTotal: 10,
}

const LEGACY_PRE_BILLING_GRACE_UNTIL = new Date('2026-08-02T00:00:00+02:00')
const LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL = 10

/** Moduły dokupywane do CORE (także w mapowaniu Stripe kind: module) */
const MODULE_KEYS = ['timer_qr', 'schedules_ai', 'tasks', 'chat', 'ai_assistant']

/** Zestaw domyślny dla pakietów — wszystko włączone */
const BUNDLE_MODULE_KEYS = [...MODULE_KEYS]

/**
 * Prefiksy API chronione per moduł (poza freemium — patrz planModuleAccessPolicy).
 * timer_qr: timer + QR; schedules_ai: grafiki + AI w grafiku; tasks: tablice/kanban; chat; ai_assistant: asystent.
 */
const MODULE_API_PREFIXES = {
	timer_qr: ['/api/workdays/timer', '/api/qr'],
	schedules_ai: ['/api/schedules'],
	tasks: ['/api/boards'],
	chat: ['/api/chat'],
	ai_assistant: ['/api/ai-assistant'],
}

/** Wiadomości AI / mies. gdy wykupiony moduł ai_assistant na CORE (nie dotyczy pakietów — tam limit z PAID_PLANS) */
const AI_ASSISTANT_MODULE_MONTHLY_MESSAGES = 50

/**
 * tierType: `core` = moduły z billingModuleKeys; `bundle` = wszystkie moduły z PAID_PLANS.includedModules
 */
const PAID_PLANS = {
	base_s: {
		maxUsers: 15,
		aiMessagesPerMonth: 0,
		includedModules: [],
		tierType: 'core',
	},
	base_m: {
		maxUsers: 30,
		aiMessagesPerMonth: 0,
		includedModules: [],
		tierType: 'core',
	},
	base_l: {
		maxUsers: 100,
		aiMessagesPerMonth: 0,
		includedModules: [],
		tierType: 'core',
	},
	pro: {
		maxUsers: 30,
		aiMessagesPerMonth: 50,
		includedModules: BUNDLE_MODULE_KEYS,
		tierType: 'bundle',
	},
	business: {
		maxUsers: 100,
		aiMessagesPerMonth: 300,
		includedModules: BUNDLE_MODULE_KEYS,
		tierType: 'bundle',
	},
	enterprise: {
		maxUsers: 300,
		aiMessagesPerMonth: 1000,
		includedModules: BUNDLE_MODULE_KEYS,
		tierType: 'bundle',
	},
}

/** Alias legacy — ten sam co base_s */
const PLAN_KEY_ALIASES = {
	starter: 'base_s',
}

const AI_ADDON_PACKS = {
	ai50: { messages: 50, pricePlnNet: 19 },
	ai200: { messages: 200, pricePlnNet: 49 },
	ai500: { messages: 500, pricePlnNet: 99 },
}

const CANONICAL_PAID_PLAN_KEYS = Object.keys(PAID_PLANS)

/** Ceny mies. netto PLN — CORE + pakiety (zgodnie z cennikiem marketingowym) */
const MONTHLY_NET_PRICES_PLN = {
	base_s: 119,
	base_m: 199,
	base_l: 349,
	pro: 239,
	business: 479,
	enterprise: 949,
}

/** Moduły dokupywane miesięcznie (referencyjnie — faktyczna kwota = Stripe / P24) */
const MODULE_MONTHLY_NET_PRICES_PLN = {
	timer_qr: 39,
	schedules_ai: 59,
	tasks: 39,
	chat: 29,
	ai_assistant: 29,
}

const ANNUAL_NET_MONTHS_CHARGED = 10

function normalizePaidPlanKey(key) {
	if (!key || typeof key !== 'string') return key
	const k = key.trim()
	const mapped = PLAN_KEY_ALIASES[k]
	return mapped || k
}

function listPaidPlanKeys() {
	return [...CANONICAL_PAID_PLAN_KEYS]
}

function isPaidPlanKey(key) {
	const k = normalizePaidPlanKey(key)
	return CANONICAL_PAID_PLAN_KEYS.includes(k)
}

function isAddonId(id) {
	return Object.prototype.hasOwnProperty.call(AI_ADDON_PACKS, id)
}

function listAddonIds() {
	return Object.keys(AI_ADDON_PACKS)
}

function isModuleKey(key) {
	return MODULE_KEYS.includes(key)
}

function listModuleKeys() {
	return [...MODULE_KEYS]
}

function isBundlePlanKey(key) {
	const k = normalizePaidPlanKey(key)
	const plan = PAID_PLANS[k]
	return plan?.tierType === 'bundle'
}

function isCorePlanKey(key) {
	const k = normalizePaidPlanKey(key)
	const plan = PAID_PLANS[k]
	return plan?.tierType === 'core'
}

function effectiveIncludedModulesForPlan(planKey) {
	const k = normalizePaidPlanKey(planKey)
	const plan = PAID_PLANS[k]
	return plan ? [...(plan.includedModules || [])] : []
}

/**
 * Na CORE: jedna wspólna pula wiadomości AI na miesiąc dla modułów
 * `ai_assistant` i `schedules_ai` (Asystent + AI w grafiku) — ten sam licznik `aiMessagesUsedInMonth`.
 */
function coreMonthlyAiPoolFromModules(billingModuleKeys) {
	const mods = Array.isArray(billingModuleKeys) ? billingModuleKeys : []
	if (mods.includes('ai_assistant') || mods.includes('schedules_ai')) {
		return AI_ASSISTANT_MODULE_MONTHLY_MESSAGES
	}
	return 0
}

/**
 * Efektywny miesięczny limit wiadomości AI (pakiet vs CORE + moduły AI).
 */
function effectiveAiMessagesPerMonth(planKey, billingModuleKeys = []) {
	const k = normalizePaidPlanKey(planKey)
	const plan = PAID_PLANS[k]
	if (!plan) return 0
	if (plan.tierType === 'bundle') return plan.aiMessagesPerMonth
	return coreMonthlyAiPoolFromModules(billingModuleKeys)
}

function checkoutAmountGroszeForPlan(planKey, billingCycle) {
	const k = normalizePaidPlanKey(planKey)
	if (!isPaidPlanKey(k)) {
		throw new Error('Invalid plan key')
	}
	const monthlyNet = MONTHLY_NET_PRICES_PLN[k]
	const netPln =
		billingCycle === 'annual' ? monthlyNet * ANNUAL_NET_MONTHS_CHARGED : monthlyNet
	return Math.round(netPln * 100)
}

/**
 * P24: suma katalogowa planu + modułów (ten sam cykl; rocznie 10× netto / moduł jak plan).
 */
function checkoutAmountGroszeForPlanWithModules(planKey, billingCycle, moduleKeys = []) {
	const k = normalizePaidPlanKey(planKey)
	if (!isPaidPlanKey(k)) {
		throw new Error('Invalid plan key')
	}
	if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
		throw new Error('Invalid billing cycle')
	}
	let netPln = MONTHLY_NET_PRICES_PLN[k]
	if (billingCycle === 'annual') {
		netPln *= ANNUAL_NET_MONTHS_CHARGED
	}
	const mods = Array.isArray(moduleKeys) ? moduleKeys : []
	for (const mk of mods) {
		if (!isModuleKey(mk)) continue
		const m = MODULE_MONTHLY_NET_PRICES_PLN[mk]
		if (m == null || !Number.isFinite(m)) continue
		netPln += billingCycle === 'annual' ? m * ANNUAL_NET_MONTHS_CHARGED : m
	}
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
	PLAN_KEY_ALIASES,
	MODULE_KEYS,
	MODULE_API_PREFIXES,
	BUNDLE_MODULE_KEYS,
	AI_ASSISTANT_MODULE_MONTHLY_MESSAGES,
	MONTHLY_NET_PRICES_PLN,
	MODULE_MONTHLY_NET_PRICES_PLN,
	CANONICAL_PAID_PLAN_KEYS,
	ANNUAL_NET_MONTHS_CHARGED,
	normalizePaidPlanKey,
	listPaidPlanKeys,
	listAddonIds,
	listModuleKeys,
	isPaidPlanKey,
	isAddonId,
	isModuleKey,
	isBundlePlanKey,
	isCorePlanKey,
	effectiveIncludedModulesForPlan,
	effectiveAiMessagesPerMonth,
	checkoutAmountGroszeForPlan,
	checkoutAmountGroszeForPlanWithModules,
	checkoutAmountGroszeForAddon,
}
