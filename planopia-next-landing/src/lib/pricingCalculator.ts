/**
 * Kalkulator cennika: z liczby osób i potrzeb wybiera jeden polecany plan.
 * BLIŹNIAK: client/src/utils/pricingCalculator.js (Pakiety w aplikacji) — ta sama logika,
 * wspólne przypadki w scripts/pricing-calculator-cases.json testują oba (reguła 7).
 * Ceny przychodzą z zewnątrz (landing: generat z planCatalog, aplikacja: katalog z API), więc funkcja jest czysta.
 */

export type PricingTier = { id: string; maxUsers: number; monthlyNetPln: number }
export type PricingModule = { id: string; monthlyNetPln: number }
export type PricingData = {
	freeMaxUsers: number
	coreTiers: readonly PricingTier[]
	bundles: readonly PricingTier[]
	modules: readonly PricingModule[]
}

/** Czego klient potrzebuje: funkcje Core (urlopy, raporty zespołu, asystent AI) i moduły do Core */
export type CalculatorNeeds = {
	leave?: boolean
	reports?: boolean
	ai?: boolean
	modules?: readonly string[]
}

export type CoreOption = { planKey: string; maxUsers: number; modules: string[]; monthlyNetPln: number }
export type BundleOption = { planKey: string; maxUsers: number; monthlyNetPln: number }

export type Recommendation =
	| { kind: 'free' }
	| { kind: 'custom' }
	| { kind: 'core'; core: CoreOption; bundle: BundleOption }
	| { kind: 'bundle'; bundle: BundleOption; core: CoreOption }

/**
 * Pakiet polecamy także wtedy, gdy jest droższy od Core z modułami najwyżej o tyle złotych —
 * „za kilka złotych więcej masz wszystko”. Bez modułów zawsze Core (pakiet nie ma sensu).
 */
export const BUNDLE_NUDGE_PLN = 10

function firstFitting<T extends PricingTier>(list: readonly T[], users: number): T | null {
	return list.find(t => t.maxUsers >= users) ?? null
}

export function recommendPlan(usersInput: number, needs: CalculatorNeeds, pricing: PricingData): Recommendation {
	const users = Math.max(1, Math.floor(Number(usersInput) || 1))
	const known = new Set(pricing.modules.map(m => m.id))
	const modules = [...new Set((needs.modules || []).filter(id => known.has(id)))]
	const wantsCore = Boolean(needs.leave || needs.reports || needs.ai)

	if (users <= pricing.freeMaxUsers && !wantsCore && modules.length === 0) return { kind: 'free' }

	const tier = firstFitting(pricing.coreTiers, users)
	const bundleTier = firstFitting(pricing.bundles, users)
	if (!tier || !bundleTier) return { kind: 'custom' }

	const modulesPrice = modules.reduce((sum, id) => sum + (pricing.modules.find(m => m.id === id)?.monthlyNetPln ?? 0), 0)
	const core: CoreOption = { planKey: tier.id, maxUsers: tier.maxUsers, modules, monthlyNetPln: tier.monthlyNetPln + modulesPrice }
	const bundle: BundleOption = { planKey: bundleTier.id, maxUsers: bundleTier.maxUsers, monthlyNetPln: bundleTier.monthlyNetPln }

	if (modules.length > 0 && bundle.monthlyNetPln <= core.monthlyNetPln + BUNDLE_NUDGE_PLN) return { kind: 'bundle', bundle, core }
	return { kind: 'core', core, bundle }
}
