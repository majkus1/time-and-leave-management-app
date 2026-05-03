const { MODULE_API_PREFIXES } = require('../constants/planCatalog')

/**
 * Zwraca listę moduleKeys wymaganych dla ścieżki (np. timer_qr dla /api/workdays/timer/*).
 * Ścieżki spoza modułów premium → pusta tablica (CORE ma dostęp jak dotąd do workdays bez timera itd.).
 */
function moduleKeysRequiredForApiPath(path) {
	const p = String(path || '').split('?')[0]
	const needed = []
	for (const [moduleKey, prefixes] of Object.entries(MODULE_API_PREFIXES)) {
		for (const prefix of prefixes) {
			if (p === prefix || p.startsWith(`${prefix}/`)) {
				needed.push(moduleKey)
				break
			}
		}
	}
	return [...new Set(needed)]
}

/**
 * Czy aktywny płatny CORE bez zakupionych modułów może wywołać ten endpoint?
 */
function corePaidPathAllowed(path, effectiveModuleKeys) {
	const keys = effectiveModuleKeys instanceof Set ? [...effectiveModuleKeys] : effectiveModuleKeys || []
	const required = moduleKeysRequiredForApiPath(path)
	if (required.length === 0) return true
	const set = new Set(keys)
	return required.every(k => set.has(k))
}

module.exports = {
	moduleKeysRequiredForApiPath,
	corePaidPathAllowed,
}
