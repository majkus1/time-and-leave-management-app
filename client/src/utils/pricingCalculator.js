// utils/pricingCalculator.js
//
// Kalkulator cennika w Pakietach: z liczby osób i potrzeb wybiera jeden polecany plan.
//
// Bliźniaczy plik: planopia-next-landing/src/lib/pricingCalculator.ts (kalkulator na landingu).
// Ta sama logika i te same przypadki w scripts/pricing-calculator-cases.json — landing i aplikacja
// muszą polecać to samo (reguła 7). Ceny przychodzą z katalogu API, więc funkcja jest czysta.

// Pakiet polecamy tylko wtedy, gdy nie jest droższy od Core z zaznaczonymi modułami — kalkulator pokazuje to, co
// klient wybrał, a nie dopłatę „za kilka złotych więcej” (wyglądało na wciskanie droższego planu).
// Bez modułów zawsze Core (pakiet nie ma sensu).

function firstFitting(list, users) {
	return list.find(t => t.maxUsers >= users) ?? null
}

/** Dane kalkulatora z odpowiedzi /api/billing/catalog (progi i moduły w sprzedaży) */
export function pricingFromCatalog(catalog) {
	return {
		freeMaxUsers: catalog?.trial?.maxUsers ?? 0,
		coreTiers: Array.isArray(catalog?.coreTiers) ? catalog.coreTiers : [],
		bundles: Array.isArray(catalog?.bundles) ? catalog.bundles : [],
		modules: Array.isArray(catalog?.modules) ? catalog.modules : [],
	}
}

/**
 * @param {number} usersInput
 * @param {{ leave?: boolean, reports?: boolean, ai?: boolean, modules?: string[] }} needs
 * @param {{ freeMaxUsers: number, coreTiers: object[], bundles: object[], modules: object[] }} pricing
 * @returns {{ kind: 'free' } | { kind: 'custom' } | { kind: 'core' | 'bundle', core: object, bundle: object }}
 */
export function recommendPlan(usersInput, needs, pricing) {
	const users = Math.max(1, Math.floor(Number(usersInput) || 1))
	const known = new Set(pricing.modules.map(m => m.id))
	const modules = [...new Set((needs?.modules || []).filter(id => known.has(id)))]
	const wantsCore = Boolean(needs?.leave || needs?.reports || needs?.ai)

	if (users <= pricing.freeMaxUsers && !wantsCore && modules.length === 0) return { kind: 'free' }

	const tier = firstFitting(pricing.coreTiers, users)
	const bundleTier = firstFitting(pricing.bundles, users)
	if (!tier || !bundleTier) return { kind: 'custom' }

	const modulesPrice = modules.reduce((sum, id) => sum + (pricing.modules.find(m => m.id === id)?.monthlyNetPln ?? 0), 0)
	const core = { planKey: tier.id, maxUsers: tier.maxUsers, modules, monthlyNetPln: tier.monthlyNetPln + modulesPrice }
	const bundle = { planKey: bundleTier.id, maxUsers: bundleTier.maxUsers, monthlyNetPln: bundleTier.monthlyNetPln }

	if (modules.length > 0 && bundle.monthlyNetPln <= core.monthlyNetPln) return { kind: 'bundle', bundle, core }
	return { kind: 'core', core, bundle }
}
