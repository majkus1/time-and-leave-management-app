/** localStorage key for UI theme preference */
export const THEME_STORAGE_KEY = 'planopia-theme'

/** Dark theme UI — przełącznik w sidebarze. */
export const THEME_SWITCHER_ENABLED = true

/** @typedef {'light' | 'dark'} ThemePreference */

/**
 * Resolve stored preference to effective light/dark.
 * @param {ThemePreference | string | null | undefined} preference
 * @returns {'light' | 'dark'}
 */
export function resolveTheme(preference) {
	if (!THEME_SWITCHER_ENABLED) return 'light'
	return preference === 'dark' ? 'dark' : 'light'
}

/**
 * Read preference from localStorage (light | dark). Default: light.
 * Legacy value "system" is treated as light.
 * @returns {ThemePreference}
 */
export function readThemePreference() {
	if (!THEME_SWITCHER_ENABLED) return 'light'
	try {
		const raw = localStorage.getItem(THEME_STORAGE_KEY)
		if (raw === 'light' || raw === 'dark') return raw
	} catch {
		/* ignore */
	}
	return 'light'
}

/**
 * Apply resolved theme to document (no React required).
 * @param {'light' | 'dark'} effective
 */
export function applyThemeToDocument(effective) {
	if (typeof document === 'undefined') return
	document.documentElement.dataset.theme = effective
	document.documentElement.style.colorScheme = effective

	const meta = document.querySelector('meta[name="theme-color"]')
	if (meta) {
		meta.setAttribute('content', effective === 'dark' ? '#0f1419' : '#0d6efd')
	}
}

/**
 * Persist preference and apply to DOM.
 * @param {ThemePreference} preference
 * @returns {'light' | 'dark'}
 */
export function setThemePreference(preference) {
	if (!THEME_SWITCHER_ENABLED) {
		applyThemeToDocument('light')
		return 'light'
	}
	const normalized = preference === 'dark' ? 'dark' : 'light'
	try {
		localStorage.setItem(THEME_STORAGE_KEY, normalized)
	} catch {
		/* ignore */
	}
	const effective = resolveTheme(normalized)
	applyThemeToDocument(effective)
	return effective
}

/** FOUC prevention — call before React paint (also inlined in index.html). */
export function initThemeFromStorage() {
	const preference = readThemePreference()
	const effective = resolveTheme(preference)
	applyThemeToDocument(effective)
	return { preference, effective }
}
