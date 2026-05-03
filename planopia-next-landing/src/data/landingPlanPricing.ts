/**
 * Statyczny cennik na landing — zgodny z server/constants/planCatalog.js (netto PLN).
 * Nie fetchujemy API; te same liczby co w aplikacji „Pakiety”.
 */
export const LANDING_ANNUAL_MONTHS_CHARGED = 10

export const landingTrial = {
	maxUsers: 5,
	aiTrialOneOffTotal: 10,
}

export const landingCoreMinMonthlyNetPln = 119

export const landingCoreTiers = [
	{ id: 'base_s' as const, maxUsers: 15, monthlyNetPln: 119 },
	{ id: 'base_m' as const, maxUsers: 30, monthlyNetPln: 199 },
	{ id: 'base_l' as const, maxUsers: 100, monthlyNetPln: 349 },
]

export const landingBundles = [
	{ id: 'pro' as const, maxUsers: 30, monthlyNetPln: 239, aiMessagesPerMonth: 50 },
	{ id: 'business' as const, maxUsers: 100, monthlyNetPln: 479, aiMessagesPerMonth: 300 },
]

export const landingModules = [
	{ id: 'timer_qr' as const, monthlyNetPln: 39 },
	{ id: 'schedules_ai' as const, monthlyNetPln: 59 },
	{ id: 'tasks' as const, monthlyNetPln: 39 },
	{ id: 'chat' as const, monthlyNetPln: 29 },
	{ id: 'ai_assistant' as const, monthlyNetPln: 29 },
]

export const landingAddons = [
	{ id: 'ai50' as const, messages: 50, pricePlnNet: 19 },
	{ id: 'ai200' as const, messages: 200, pricePlnNet: 49 },
	{ id: 'ai500' as const, messages: 500, pricePlnNet: 99 },
]

export type CorePlanId = (typeof landingCoreTiers)[number]['id']
export type ModuleId = (typeof landingModules)[number]['id']
