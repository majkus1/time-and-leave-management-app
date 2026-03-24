const {
	TRIAL,
	PAID_PLANS,
	AI_ADDON_PACKS,
	MONTHLY_NET_PRICES_PLN,
	listPaidPlanKeys,
	listAddonIds,
} = require('../constants/planCatalog')

function buildPublicCatalog() {
	const tiers = listPaidPlanKeys().map(id => ({
		id,
		monthlyNetPln: MONTHLY_NET_PRICES_PLN[id] ?? null,
		maxUsers: PAID_PLANS[id].maxUsers,
		aiMessagesPerMonth: PAID_PLANS[id].aiMessagesPerMonth,
	}))

	const addons = listAddonIds().map(id => ({
		id,
		messages: AI_ADDON_PACKS[id].messages,
		pricePlnNet: AI_ADDON_PACKS[id].pricePlnNet,
	}))

	return {
		trial: {
			maxUsers: TRIAL.maxUsers,
			aiTrialOneOffTotal: TRIAL.aiTrialOneOffTotal,
			days: 30,
		},
		tiers,
		addons,
	}
}

module.exports = { buildPublicCatalog }
