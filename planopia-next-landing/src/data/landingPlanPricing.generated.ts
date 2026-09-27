/**
 * PLIK GENEROWANY — nie edytuj ręcznie.
 * Źródło: server/constants/productKnowledge/*.js + server/constants/planCatalog.js
 * Odśwież: npm run knowledge:build (z katalogu głównego repo). CI: npm run knowledge:check
 */

export const LANDING_ANNUAL_MONTHS_CHARGED = 10

export const LANDING_TRIAL_DAYS = 30

export const landingTrial = {
	maxUsers: 5,
}

export const landingCoreTiers = [
	{ id: "base_5" as const, maxUsers: 5, monthlyNetPln: 69 },
	{ id: "base_s" as const, maxUsers: 15, monthlyNetPln: 119 },
	{ id: "base_m" as const, maxUsers: 30, monthlyNetPln: 199 },
	{ id: "base_50" as const, maxUsers: 50, monthlyNetPln: 269 },
	{ id: "base_l" as const, maxUsers: 100, monthlyNetPln: 349 },
]

export const landingBundles = [
	{ id: "pro_15" as const, maxUsers: 15, monthlyNetPln: 189 },
	{ id: "pro" as const, maxUsers: 30, monthlyNetPln: 239 },
	{ id: "pro_50" as const, maxUsers: 50, monthlyNetPln: 329 },
	{ id: "business" as const, maxUsers: 100, monthlyNetPln: 479 },
]

export const landingModules = [
	{ id: "timer_qr" as const, monthlyNetPln: 39 },
	{ id: "schedules_ai" as const, monthlyNetPln: 59 },
	{ id: "tasks_chat" as const, monthlyNetPln: 59 },
]

/** Mapa „co jest gdzie” z planCatalog.FEATURES — kafelki „O aplikacji” i kalkulator cennika */
export const landingFeatures = [
	{ id: "timesheet" as const, plan: "free" as const },
	{ id: "timesheet_print" as const, plan: "free" as const },
	{ id: "leave" as const, plan: "core" as const },
	{ id: "team_overview" as const, plan: "core" as const },
	{ id: "team_reports" as const, plan: "core" as const },
	{ id: "ai_assistant" as const, plan: "core" as const },
	{ id: "notifications" as const, plan: "core" as const },
	{ id: "timer_qr" as const, plan: "module" as const, module: "timer_qr" as const },
	{ id: "schedules" as const, plan: "module" as const, module: "schedules_ai" as const },
	{ id: "tasks_chat" as const, plan: "module" as const, module: "tasks_chat" as const },
	{ id: "mobile" as const, plan: "all" as const },
	{ id: "security" as const, plan: "all" as const },
	{ id: "support" as const, plan: "all" as const },
]

export type CorePlanId = (typeof landingCoreTiers)[number]['id']
export type BundlePlanId = (typeof landingBundles)[number]['id']
export type ModuleId = (typeof landingModules)[number]['id']
export type FeatureId = (typeof landingFeatures)[number]['id']
