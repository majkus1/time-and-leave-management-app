/** Język aplikacji dla atrybutu lang (tylko pl / en). */
export function resolveAppHtmlLang(lng) {
	const raw = String(lng || 'pl').toLowerCase()
	return raw.startsWith('pl') ? 'pl' : 'en'
}

/**
 * Ustawia lang i blokuje auto-tłumaczenie przeglądarki (Chrome itd.).
 * Aplikacja ma własny PL/EN — tłumaczenie strony psuje m.in. FullCalendar.
 */
export function applyDocumentLanguage(lng) {
	if (typeof document === 'undefined') return
	const lang = resolveAppHtmlLang(lng)
	const html = document.documentElement
	html.lang = lang
	html.setAttribute('translate', 'no')
	html.classList.add('notranslate')
}

export function bindDocumentLanguageToI18n(i18nInstance) {
	const sync = () => {
		applyDocumentLanguage(i18nInstance.resolvedLanguage || i18nInstance.language)
	}
	i18nInstance.on('initialized', sync)
	i18nInstance.on('languageChanged', sync)
	if (i18nInstance.isInitialized) {
		sync()
	}
}
