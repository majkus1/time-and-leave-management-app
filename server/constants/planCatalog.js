/**
 * Cennik Planopia — single source of truth (apka, aktywacja, webhooks, landing przez generator).
 *
 * Core (ewidencja, urlopy, przegląd i raporty zespołu, asystent AI) w progach: `base_5` (≤5), `base_s` (≤15),
 * `base_m` (≤30), `base_50` (≤50), `base_l` (≤100) + moduły: Timer i QR, Grafiki, Zadania i czat.
 * PRO / BUSINESS / ENTERPRISE — wszystko w cenie: `pro_15`, `pro` (≤30), `pro_50`, `business`, `enterprise` (poza sprzedażą).
 * Istniejące klucze (base_s/m/l, pro, business) zachowują ceny i limity — płacą z nich obecni klienci
 * i stare ceny Stripe; nowe progi to nowe klucze. Klucz `starter` w Mongo = alias legacy → `base_s`.
 */

const TRIAL = {
	maxUsers: 5,
	/** Historyczna pula AI okresu próbnego — od 09.2026 nie ogranicza (AI_FAIR_USE); zostaje dla zgodności API. */
	aiTrialOneOffTotal: 10,
}

/**
 * AI bez limitu wiadomości (od 09.2026): kto ma AI w planie (okres próbny i każdy plan płatny — Core ma asystenta
 * w cenie, stare zespoły Core dostają go przez CORE_INCLUDED_CAPABILITIES), nie widzi licznika. Zostaje ukryty miesięczny bezpiecznik na zespół — przed nadużyciem
 * (np. skryptem), nie przed normalną pracą. Na serwerze nadpisywalny: AI_FAIR_USE_MONTHLY, AI_FAIR_USE_TRIAL_MONTHLY
 * (0 = awaryjne wyłączenie AI). Okres próbny niżej: zakłada się go bez weryfikacji maila, a realnie zużywa 1–6 wiadomości.
 */
const AI_FAIR_USE = {
	paidMonthlyMessages: 1000,
	trialMonthlyMessages: 50,
}

/** Pakiety wiadomości AI wycofane ze sprzedaży razem z limitami — definicje zostają dla starych cen Stripe i historii. */
const AI_ADDONS_ON_SALE = false

const LEGACY_PRE_BILLING_GRACE_UNTIL = new Date('2026-08-02T00:00:00+02:00')
const LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL = 10

/**
 * Funkcje sprawdzane przez API, menu i ekrany — każda osobno (effectiveBillingModuleKeys zwraca tę listę).
 * Moduły sprzedażowe rozwijają się na funkcje w MODULE_CAPABILITIES, więc bramki nie zależą od sposobu sprzedaży.
 */
const CAPABILITY_KEYS = ['timer_qr', 'schedules_ai', 'tasks', 'chat', 'ai_assistant']

/**
 * Wszystkie znane klucze modułów zapisywane w Team.billingModuleKeys / Stripe → funkcje, które włączają.
 * `tasks_chat` („Zadania i czat”) sprzedawany od 10.2026; osobne `tasks`, `chat`, `ai_assistant` działają u zespołów,
 * które je mają, ale nie są już w sprzedaży (asystent AI jest w Core).
 */
const MODULE_CAPABILITIES = {
	timer_qr: ['timer_qr'],
	schedules_ai: ['schedules_ai'],
	tasks_chat: ['tasks', 'chat'],
	tasks: ['tasks'],
	chat: ['chat'],
	ai_assistant: ['ai_assistant'],
}

/** Klucze modułów uznawane w danych (walidacja billingModuleKeys, Stripe, P24) */
const MODULE_KEYS = Object.keys(MODULE_CAPABILITIES)

/** Moduły w sprzedaży do Core — konfigurator, kalkulator, nowe zakupy */
const SALE_MODULE_KEYS = ['timer_qr', 'schedules_ai', 'tasks_chat']

/** Zestaw dla pakietów — wszystkie funkcje */
const BUNDLE_MODULE_KEYS = [...CAPABILITY_KEYS]

/** Core zawiera asystenta AI (od 10.2026 — także obecne Core S/M/L, w tej samej cenie) */
const CORE_INCLUDED_CAPABILITIES = ['ai_assistant']

/**
 * Prefiksy API chronione per funkcja (poza freemium — patrz planModuleAccessPolicy).
 * timer_qr: timer + QR; schedules_ai: grafiki + AI w grafiku; tasks: tablice zadań; chat; ai_assistant: asystent.
 */
const MODULE_API_PREFIXES = {
	timer_qr: ['/api/workdays/timer', '/api/qr'],
	schedules_ai: ['/api/schedules'],
	tasks: ['/api/boards'],
	chat: ['/api/chat'],
	ai_assistant: ['/api/ai-assistant'],
}

/**
 * Wiadomości AI / mies. przy module ai_assistant lub schedules_ai na CORE. Od 09.2026 liczba > 0 oznacza tylko
 * „AI w planie” — limit wyznacza AI_FAIR_USE (tak samo aiMessagesPerMonth w PAID_PLANS).
 */
const AI_ASSISTANT_MODULE_MONTHLY_MESSAGES = 50

/**
 * tierType: `core` = moduły z billingModuleKeys; `bundle` = wszystkie moduły z PAID_PLANS.includedModules
 */
const PAID_PLANS = {
	base_5: {
		maxUsers: 5,
		aiMessagesPerMonth: 0,
		includedModules: CORE_INCLUDED_CAPABILITIES,
		tierType: 'core',
	},
	base_s: {
		maxUsers: 15,
		aiMessagesPerMonth: 0,
		includedModules: CORE_INCLUDED_CAPABILITIES,
		tierType: 'core',
	},
	base_m: {
		maxUsers: 30,
		aiMessagesPerMonth: 0,
		includedModules: CORE_INCLUDED_CAPABILITIES,
		tierType: 'core',
	},
	base_50: {
		maxUsers: 50,
		aiMessagesPerMonth: 0,
		includedModules: CORE_INCLUDED_CAPABILITIES,
		tierType: 'core',
	},
	base_l: {
		maxUsers: 100,
		aiMessagesPerMonth: 0,
		includedModules: CORE_INCLUDED_CAPABILITIES,
		tierType: 'core',
	},
	pro_15: {
		maxUsers: 15,
		aiMessagesPerMonth: 50,
		includedModules: BUNDLE_MODULE_KEYS,
		tierType: 'bundle',
	},
	pro: {
		maxUsers: 30,
		aiMessagesPerMonth: 50,
		includedModules: BUNDLE_MODULE_KEYS,
		tierType: 'bundle',
	},
	pro_50: {
		maxUsers: 50,
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
	base_5: 69,
	base_s: 119,
	base_m: 199,
	base_50: 269,
	base_l: 349,
	pro_15: 189,
	pro: 239,
	pro_50: 329,
	business: 479,
	enterprise: 949,
}

/** Moduły dokupywane miesięcznie (referencyjnie — faktyczna kwota = Stripe / P24). tasks/chat/ai_assistant — dawne, poza sprzedażą */
const MODULE_MONTHLY_NET_PRICES_PLN = {
	timer_qr: 39,
	schedules_ai: 59,
	tasks_chat: 59,
	tasks: 39,
	chat: 29,
	ai_assistant: 29,
}

/** Plany w sprzedaży (kalkulator, konfigurator, landing). enterprise — tylko indywidualnie. */
const SALE_PLAN_KEYS = ['base_5', 'base_s', 'base_m', 'base_50', 'base_l', 'pro_15', 'pro', 'pro_50', 'business']

/** Nazwy planów i modułów dla ludzi — jedno źródło dla maili, P24, asystenta i aplikacji */
const PLAN_LABELS = {
	base_5: { pl: 'Core · do 5 osób', en: 'Core · up to 5 people' },
	base_s: { pl: 'Core · do 15 osób', en: 'Core · up to 15 people' },
	base_m: { pl: 'Core · do 30 osób', en: 'Core · up to 30 people' },
	base_50: { pl: 'Core · do 50 osób', en: 'Core · up to 50 people' },
	base_l: { pl: 'Core · do 100 osób', en: 'Core · up to 100 people' },
	pro_15: { pl: 'PRO · do 15 osób', en: 'PRO · up to 15 people' },
	pro: { pl: 'PRO · do 30 osób', en: 'PRO · up to 30 people' },
	pro_50: { pl: 'PRO · do 50 osób', en: 'PRO · up to 50 people' },
	business: { pl: 'Business · do 100 osób', en: 'Business · up to 100 people' },
	enterprise: { pl: 'Enterprise', en: 'Enterprise' },
	trial: { pl: 'Okres próbny', en: 'Trial' },
}

/**
 * Mapa „co jest gdzie” dla klienta (kafelki „O aplikacji”, kalkulator, porównanie planów, aplikacja):
 * free = plan darmowy i wyżej, core = Core i wyżej, module = moduł do Core (albo PRO/Business), all = każdy plan.
 * Teksty (nazwy, opisy) żyją w warstwie prezentacji; tu tylko przypisanie do planu.
 */
const FEATURES = [
	{ id: 'timesheet', plan: 'free' },
	{ id: 'timesheet_print', plan: 'free' },
	{ id: 'leave', plan: 'core' },
	{ id: 'team_overview', plan: 'core' },
	{ id: 'team_reports', plan: 'core' },
	{ id: 'ai_assistant', plan: 'core' },
	{ id: 'notifications', plan: 'core' },
	{ id: 'timer_qr', plan: 'module', module: 'timer_qr' },
	{ id: 'schedules', plan: 'module', module: 'schedules_ai' },
	{ id: 'tasks_chat', plan: 'module', module: 'tasks_chat' },
	{ id: 'mobile', plan: 'all' },
	{ id: 'security', plan: 'all' },
	{ id: 'support', plan: 'all' },
]

const MODULE_LABELS = {
	timer_qr: { pl: 'Timer i QR', en: 'Timer and QR' },
	schedules_ai: { pl: 'Grafiki', en: 'Schedules' },
	tasks_chat: { pl: 'Zadania i czat', en: 'Tasks and chat' },
	tasks: { pl: 'Zadania', en: 'Tasks' },
	chat: { pl: 'Czat', en: 'Chat' },
	ai_assistant: { pl: 'Asystent AI', en: 'AI assistant' },
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

function isSaleModuleKey(key) {
	return SALE_MODULE_KEYS.includes(key)
}

function listSaleModuleKeys() {
	return [...SALE_MODULE_KEYS]
}

function listSalePlanKeys() {
	return [...SALE_PLAN_KEYS]
}

/** Klucze modułów (także funkcji, np. z includedModules) → unikalna lista funkcji; nieznane klucze pomijane */
function capabilitiesForModuleKeys(keys = []) {
	const out = new Set()
	for (const key of Array.isArray(keys) ? keys : []) {
		for (const capability of MODULE_CAPABILITIES[key] || []) out.add(capability)
	}
	return CAPABILITY_KEYS.filter(k => out.has(k))
}

function planLabel(planKey, locale = 'pl') {
	const k = normalizePaidPlanKey(planKey)
	const label = PLAN_LABELS[k]
	return label ? label[locale === 'en' ? 'en' : 'pl'] : String(planKey || '')
}

function moduleLabel(moduleKey, locale = 'pl') {
	const label = MODULE_LABELS[moduleKey]
	return label ? label[locale === 'en' ? 'en' : 'pl'] : String(moduleKey || '')
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

/**
 * Kwota rejestracji P24 (grosze). Domyślnie jak checkoutAmountGroszeForPlan*.
 * Test prod: P24_TEST_PRO_PRICE_GROSZE=100 → PRO miesięcznie 1,00 PLN (bez modułów CORE).
 */
function p24CheckoutAmountGroszeForPlan(planKey, billingCycle, moduleKeys = []) {
	const overrideRaw = process.env.P24_TEST_PRO_PRICE_GROSZE
	const k = normalizePaidPlanKey(planKey)
	const mods = Array.isArray(moduleKeys) ? moduleKeys.filter(isModuleKey) : []
	if (overrideRaw != null && String(overrideRaw).trim() !== '') {
		const override = parseInt(String(overrideRaw).trim(), 10)
		if (
			Number.isFinite(override) &&
			override > 0 &&
			k === 'pro' &&
			billingCycle === 'monthly' &&
			mods.length === 0
		) {
			return override
		}
	}
	if (mods.length > 0) {
		return checkoutAmountGroszeForPlanWithModules(planKey, billingCycle, mods)
	}
	return checkoutAmountGroszeForPlan(planKey, billingCycle)
}

module.exports = {
	TRIAL,
	AI_FAIR_USE,
	AI_ADDONS_ON_SALE,
	LEGACY_PRE_BILLING_GRACE_UNTIL,
	LEGACY_PRE_BILLING_GRACE_ONE_OFF_AI_TOTAL,
	PAID_PLANS,
	AI_ADDON_PACKS,
	PLAN_KEY_ALIASES,
	MODULE_KEYS,
	CAPABILITY_KEYS,
	MODULE_CAPABILITIES,
	SALE_MODULE_KEYS,
	SALE_PLAN_KEYS,
	CORE_INCLUDED_CAPABILITIES,
	PLAN_LABELS,
	MODULE_LABELS,
	FEATURES,
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
	isSaleModuleKey,
	listSaleModuleKeys,
	listSalePlanKeys,
	capabilitiesForModuleKeys,
	planLabel,
	moduleLabel,
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
	p24CheckoutAmountGroszeForPlan,
}
