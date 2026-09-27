// utils/planModules.js
//
// Moduły w sprzedaży (katalog API: timer_qr, schedules_ai, tasks_chat) a funkcje zespołu z entitlements
// (effectiveKeys: timer_qr, schedules_ai, tasks, chat, ai_assistant). Jeden moduł może włączać kilka
// funkcji — „Zadania i czat” to zadania + czat — więc porównujemy po capabilities, nie po id.

function capabilitiesOf(module) {
	return Array.isArray(module?.capabilities) && module.capabilities.length ? module.capabilities : [module?.id]
}

/** Moduły, które zespół ma w całości — do porównania „to Wasz obecny plan” */
export function ownedSaleModules(catalogModules, effectiveKeys) {
	const keys = new Set(Array.isArray(effectiveKeys) ? effectiveKeys : [])
	return (catalogModules || []).filter(m => capabilitiesOf(m).every(c => keys.has(c))).map(m => m.id)
}

/** Moduły, z których zespół korzysta choć częściowo (stary moduł „Zadania” → „Zadania i czat”) — do podpowiedzi w kalkulatorze */
export function usedSaleModules(catalogModules, effectiveKeys) {
	const keys = new Set(Array.isArray(effectiveKeys) ? effectiveKeys : [])
	return (catalogModules || []).filter(m => capabilitiesOf(m).some(c => keys.has(c))).map(m => m.id)
}

/** Moduł w sprzedaży, który włącza funkcję (menu: kłódka z ceną) */
export function saleModuleForCapability(catalogModules, capability) {
	return (catalogModules || []).find(m => capabilitiesOf(m).includes(capability)) || null
}
