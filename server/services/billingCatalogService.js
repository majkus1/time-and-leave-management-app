const {
	TRIAL,
	PAID_PLANS,
	AI_ADDON_PACKS,
	MONTHLY_NET_PRICES_PLN,
	MODULE_MONTHLY_NET_PRICES_PLN,
	listPaidPlanKeys,
	listAddonIds,
	listModuleKeys,
} = require('../constants/planCatalog')

function buildPublicCatalog() {
	const allIds = listPaidPlanKeys()
	const coreTiers = allIds
		.filter(id => PAID_PLANS[id].tierType === 'core')
		.map(id => ({
			id,
			monthlyNetPln: MONTHLY_NET_PRICES_PLN[id] ?? null,
			maxUsers: PAID_PLANS[id].maxUsers,
			tierType: 'core',
		}))

	const bundles = allIds
		.filter(id => PAID_PLANS[id].tierType === 'bundle')
		.map(id => ({
			id,
			monthlyNetPln: MONTHLY_NET_PRICES_PLN[id] ?? null,
			maxUsers: PAID_PLANS[id].maxUsers,
			aiMessagesPerMonth: PAID_PLANS[id].aiMessagesPerMonth,
			tierType: 'bundle',
		}))

	const modules = listModuleKeys().map(id => ({
		id,
		monthlyNetPln: MODULE_MONTHLY_NET_PRICES_PLN[id] ?? null,
	}))

	const addons = listAddonIds().map(id => ({
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
