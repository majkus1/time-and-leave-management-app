const {
	TRIAL,
	PAID_PLANS,
	AI_ADDON_PACKS,
	AI_ADDONS_ON_SALE,
	MONTHLY_NET_PRICES_PLN,
	MODULE_MONTHLY_NET_PRICES_PLN,
	listPaidPlanKeys,
	listAddonIds,
	listSaleModuleKeys,
	listSalePlanKeys,
	PLAN_LABELS,
	MODULE_LABELS,
	MODULE_CAPABILITIES,
} = require('../constants/planCatalog')

function buildPublicCatalog() {
	const allIds = listPaidPlanKeys()
	// W sprzedaży: progi Core i pakiety bez Enterprise (wycena indywidualna); lista tiers zostaje pełna dla etykiet
	const saleIds = listSalePlanKeys()
	const coreTiers = saleIds
		.filter(id => PAID_PLANS[id].tierType === 'core')
		.map(id => ({
			id,
			monthlyNetPln: MONTHLY_NET_PRICES_PLN[id] ?? null,
			maxUsers: PAID_PLANS[id].maxUsers,
			tierType: 'core',
		}))

	const bundles = saleIds
		.filter(id => PAID_PLANS[id].tierType === 'bundle')
		.map(id => ({
			id,
			monthlyNetPln: MONTHLY_NET_PRICES_PLN[id] ?? null,
			maxUsers: PAID_PLANS[id].maxUsers,
			aiMessagesPerMonth: PAID_PLANS[id].aiMessagesPerMonth,
			tierType: 'bundle',
		}))

	// Moduły w sprzedaży i funkcje, które włączają (np. „Zadania i czat” → zadania + czat)
	const modules = listSaleModuleKeys().map(id => ({
		id,
		monthlyNetPln: MODULE_MONTHLY_NET_PRICES_PLN[id] ?? null,
		capabilities: [...(MODULE_CAPABILITIES[id] || [])],
		label: MODULE_LABELS[id],
	}))

	// Pakiety AI wycofane ze sprzedaży (AI bez limitu) — klient nie pokazuje sekcji, gdy lista jest pusta
	const addons = (AI_ADDONS_ON_SALE ? listAddonIds() : []).map(id => ({
		id,
		messages: AI_ADDON_PACKS[id].messages,
		pricePlnNet: AI_ADDON_PACKS[id].pricePlnNet,
	}))

	const tiers = allIds.map(id => ({
		id,
		monthlyNetPln: MONTHLY_NET_PRICES_PLN[id] ?? null,
		maxUsers: PAID_PLANS[id].maxUsers,
		aiMessagesPerMonth: PAID_PLANS[id].aiMessagesPerMonth,
		tierType: PAID_PLANS[id].tierType,
		label: PLAN_LABELS[id],
	}))

	return {
		trial: {
			maxUsers: TRIAL.maxUsers,
			aiTrialOneOffTotal: TRIAL.aiTrialOneOffTotal,
			days: 30,
		},
		coreTiers,
		bundles,
		modules,
		tiers,
		addons,
	}
}

module.exports = { buildPublicCatalog }
