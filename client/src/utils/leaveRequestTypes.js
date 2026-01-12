/**
 * Helper functions dla typów wniosków urlopowych (frontend)
 */

/**
 * Pobierz nazwę typu wniosku (dla wyświetlania)
 * @param {Object} settings - Settings object z useSettings()
 * @param {String} typeId - ID typu (np. 'leaveform.option1' lub 'custom-xxx')
 * @param {Function} t - Funkcja tłumaczeń z useTranslation()
 * @param {String} language - Język ('pl' lub 'en', domyślnie używa i18n.resolvedLanguage)
 * @returns {String} - Nazwa typu w odpowiednim języku
 */
export function getLeaveRequestTypeName(settings, typeId, t, language = null) {
	if (!typeId) return typeId || 'Unknown'
	
	// Jeśli nie ma settings, użyj tłumaczeń jako fallback
	if (!settings || !settings.leaveRequestTypes || !Array.isArray(settings.leaveRequestTypes)) {
		if (t) {
			const translated = t(typeId)
			if (translated && translated !== typeId) {
				return translated
			}
		}
		return typeId
	}
	
	// Znajdź typ w Settings
	const type = settings.leaveRequestTypes.find(t => t.id === typeId)
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
