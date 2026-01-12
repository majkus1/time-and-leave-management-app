/**
 * Helper functions dla typów wniosków urlopowych
 */

/**
 * Pobierz typ wniosku z Settings dla zespołu
 * @param {Object} settings - Settings object
 * @param {String} typeKey - Key typu (np. 'leaveform.option1' lub 'custom-xxx')
 * @returns {Object|null} - Typ wniosku lub null jeśli nie znaleziony
 */
function getLeaveRequestType(settings, typeKey) {
	if (!settings || !settings.leaveRequestTypes || !Array.isArray(settings.leaveRequestTypes)) {
		return null
	}
	
	return settings.leaveRequestTypes.find(type => type.id === typeKey && type.isEnabled) || null
}

/**
 * Sprawdź czy typ wniosku istnieje i jest włączony
 * @param {Object} settings - Settings object
 * @param {String} typeKey - Key typu
 * @returns {Boolean}
 */
function isLeaveRequestTypeValid(settings, typeKey) {
	const type = getLeaveRequestType(settings, typeKey)
	return type !== null
}

/**
 * Sprawdź czy typ wymaga zatwierdzenia (requiresApproval)
 * @param {Object} settings - Settings object
 * @param {String} typeKey - Key typu
 * @returns {Boolean} - true jeśli wymaga zatwierdzenia, false jeśli automatycznie akceptowany
 */
function requiresApproval(settings, typeKey) {
	const type = getLeaveRequestType(settings, typeKey)
	if (!type) {
		// Domyślnie wymaga zatwierdzenia jeśli typ nie znaleziony (bezpieczniej)
		return true
	}
	return type.requireApproval !== false
}

/**
 * Pobierz wszystkie włączone typy wniosków dla zespołu
 * @param {Object} settings - Settings object
 * @returns {Array} - Tablica włączonych typów
 */
function getEnabledLeaveRequestTypes(settings) {
	if (!settings || !settings.leaveRequestTypes || !Array.isArray(settings.leaveRequestTypes)) {
		return []
	}
	return settings.leaveRequestTypes.filter(type => type.isEnabled)
}

/**
 * Pobierz typ wniosku z Settings bez sprawdzania isEnabled (dla wyświetlania nazw w istniejących wnioskach)
 * @param {Object} settings - Settings object
 * @param {String} typeKey - Key typu (np. 'leaveform.option1' lub 'custom-xxx')
 * @returns {Object|null} - Typ wniosku lub null jeśli nie znaleziony
 */
function getLeaveRequestTypeById(settings, typeKey) {
	if (!settings || !settings.leaveRequestTypes || !Array.isArray(settings.leaveRequestTypes)) {
		return null
	}
	
	return settings.leaveRequestTypes.find(type => type.id === typeKey) || null
}

/**
 * Pobierz nazwę typu wniosku (dla wyświetlania)
 * @param {Object} settings - Settings object
 * @param {String} typeId - ID typu (np. 'leaveform.option1' lub 'custom-xxx')
 * @param {Function} t - Funkcja tłumaczeń (opcjonalna)
 * @param {String} language - Język ('pl' lub 'en', domyślnie 'pl')
 * @returns {String} - Nazwa typu w odpowiednim języku
 */
function getLeaveRequestTypeName(settings, typeId, t = null, language = 'pl') {
	if (!typeId) return typeId || 'Unknown'
	
	// Najpierw sprawdź czy to typ w Settings (custom lub systemowy) - bez sprawdzania isEnabled
	// (ponieważ dla wyświetlania nazw w istniejących wnioskach potrzebujemy nazwy nawet jeśli typ jest wyłączony)
	const type = getLeaveRequestTypeById(settings, typeId)
	if (type) {
		// Jeśli typ ma nameEn i język to 'en', zwróć nameEn
		if (language === 'en' && type.nameEn) {
			return type.nameEn
		}
		// W przeciwnym razie zwróć name (PL)
		return type.name
	}
	
	// Jeśli typ nie znaleziony w Settings, spróbuj tłumaczeń dla typów systemowych
	if (t) {
		const translated = t(typeId)
		// Jeśli tłumaczenie istnieje (nie zwrócono klucza), użyj go
		if (translated && translated !== typeId) {
			return translated
		}
	}
	
	// Fallback - zwróć ID jeśli nie znaleziono nazwy
	return typeId
}

module.exports = {
	getLeaveRequestType,
	isLeaveRequestTypeValid,
	requiresApproval,
	getEnabledLeaveRequestTypes,
	getLeaveRequestTypeName
}
