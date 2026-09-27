const test = require('node:test')
const assert = require('node:assert/strict')
const c = require('../constants/planCatalog')

// Z tych planów płacą obecni klienci (BZ, Halo, JumpFly, IRONSKY, Smart Cube) i na nich stoją stare ceny Stripe —
// cena i limit osób nie mogą się zmienić przy żadnej zmianie cennika.
test('obecne plany: te same ceny i limity osób', () => {
	const legacy = {
		base_s: [119, 15],
		base_m: [199, 30],
		base_l: [349, 100],
		pro: [239, 30],
		business: [479, 100],
	}
	for (const [key, [price, maxUsers]] of Object.entries(legacy)) {
		assert.equal(c.MONTHLY_NET_PRICES_PLN[key], price, `${key}: cena`)
		assert.equal(c.PAID_PLANS[key].maxUsers, maxUsers, `${key}: limit osób`)
	}
	assert.equal(c.normalizePaidPlanKey('starter'), 'base_s')
	assert.equal(c.ANNUAL_NET_MONTHS_CHARGED, 10)
})

test('nowy cennik: progi Core i PRO, moduły w sprzedaży', () => {
	const tiers = {
		base_5: [69, 5, 'core'],
		base_s: [119, 15, 'core'],
		base_m: [199, 30, 'core'],
		base_50: [269, 50, 'core'],
		base_l: [349, 100, 'core'],
		pro_15: [189, 15, 'bundle'],
		pro: [239, 30, 'bundle'],
		pro_50: [329, 50, 'bundle'],
		business: [479, 100, 'bundle'],
	}
	assert.deepEqual(c.listSalePlanKeys(), Object.keys(tiers))
	for (const [key, [price, maxUsers, tierType]] of Object.entries(tiers)) {
		assert.equal(c.MONTHLY_NET_PRICES_PLN[key], price, key)
		assert.equal(c.PAID_PLANS[key].maxUsers, maxUsers, key)
		assert.equal(c.PAID_PLANS[key].tierType, tierType, key)
		assert.ok(c.planLabel(key, 'pl') && c.planLabel(key, 'en'), `${key}: nazwa`)
	}
	assert.ok(!c.listSalePlanKeys().includes('enterprise'), 'Enterprise poza sprzedażą')
	assert.deepEqual(c.listSaleModuleKeys(), ['timer_qr', 'schedules_ai', 'tasks_chat'])
	assert.deepEqual(c.listSaleModuleKeys().map(k => c.MODULE_MONTHLY_NET_PRICES_PLN[k]), [39, 59, 59])
	assert.equal(c.planLabel('base_s'), 'Core · do 15 osób')
	assert.equal(c.moduleLabel('tasks_chat'), 'Zadania i czat')
})

test('funkcje: Core ma asystenta AI, „Zadania i czat” włącza zadania i czat, pakiety — wszystko', () => {
	for (const key of ['base_5', 'base_s', 'base_m', 'base_50', 'base_l']) {
		assert.deepEqual(c.capabilitiesForModuleKeys(c.PAID_PLANS[key].includedModules), ['ai_assistant'], key)
	}
	assert.deepEqual(c.capabilitiesForModuleKeys(['tasks_chat']), ['tasks', 'chat'])
	assert.deepEqual(c.capabilitiesForModuleKeys(['ai_assistant', 'tasks_chat', 'timer_qr']), ['timer_qr', 'tasks', 'chat', 'ai_assistant'])
	// Dawne osobne moduły działają u zespołów, które je mają
	assert.deepEqual(c.capabilitiesForModuleKeys(['chat']), ['chat'])
	assert.deepEqual(c.capabilitiesForModuleKeys(['nieznany', null]), [])
	for (const key of ['pro_15', 'pro', 'pro_50', 'business']) {
		assert.deepEqual(c.capabilitiesForModuleKeys(c.PAID_PLANS[key].includedModules), c.CAPABILITY_KEYS, key)
	}
	// Każda funkcja ma prefiksy API, a każdy znany moduł rozwija się na znane funkcje
	assert.deepEqual(Object.keys(c.MODULE_API_PREFIXES).sort(), [...c.CAPABILITY_KEYS].sort())
	for (const key of c.MODULE_KEYS) {
		assert.ok(c.MODULE_CAPABILITIES[key].every(cap => c.CAPABILITY_KEYS.includes(cap)), key)
		assert.ok(Number.isFinite(c.MODULE_MONTHLY_NET_PRICES_PLN[key]), `${key}: cena`)
	}
})

test('kwota P24: Core do 5 z „Zadania i czat” i rocznie 10×', () => {
	assert.equal(c.checkoutAmountGroszeForPlanWithModules('base_5', 'monthly', ['tasks_chat']), (69 + 59) * 100)
	assert.equal(c.checkoutAmountGroszeForPlanWithModules('base_50', 'annual', ['timer_qr']), (269 + 39) * 10 * 100)
	assert.equal(c.checkoutAmountGroszeForPlan('pro_15', 'monthly'), 18900)
})
