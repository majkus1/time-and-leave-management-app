import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
	applyThemeToDocument,
	readThemePreference,
	resolveTheme,
	setThemePreference,
} from '../utils/themeStorage'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
	const [preference, setPreferenceState] = useState(() => readThemePreference())
	const [effectiveTheme, setEffectiveTheme] = useState(() => resolveTheme(readThemePreference()))

	useEffect(() => {
		const pref = readThemePreference()
		const effective = resolveTheme(pref)
		setPreferenceState(pref)
		setEffectiveTheme(effective)
		applyThemeToDocument(effective)
	}, [])

	const setTheme = useCallback(next => {
		const effective = setThemePreference(next)
		setPreferenceState(next === 'dark' ? 'dark' : 'light')
		setEffectiveTheme(effective)
	}, [])

	const value = useMemo(
		() => ({
			preference,
			effectiveTheme,
			setTheme,
			isDark: effectiveTheme === 'dark',
		}),
		[preference, effectiveTheme, setTheme]
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
	const ctx = useContext(ThemeContext)
	if (!ctx) {
		throw new Error('useTheme must be used within ThemeProvider')
	}
	return ctx
}
