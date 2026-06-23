import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { THEME_SWITCHER_ENABLED } from '../../utils/themeStorage'

function MoonIcon() {
	return (
		<svg className="po-sidebar-theme-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
			<path
				d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function SunIcon() {
	return (
		<svg className="po-sidebar-theme-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	)
}

/** Compact sun/moon toggle — icon shows target theme (light → moon, dark → sun). */
export default function SidebarThemeButton() {
	const { t } = useTranslation()
	const { effectiveTheme, setTheme } = useTheme()

	if (!THEME_SWITCHER_ENABLED) return null

	const isDark = effectiveTheme === 'dark'

	const toggle = () => {
		setTheme(isDark ? 'light' : 'dark')
	}

	const label = isDark ? t('settings.themeSwitchToLight') : t('settings.themeSwitchToDark')

	return (
		<div className="po-sidebar-theme">
			<button
				type="button"
				className="po-sidebar-theme-btn"
				onClick={toggle}
				title={label}
				aria-label={label}
			>
				{isDark ? <SunIcon /> : <MoonIcon />}
			</button>
		</div>
	)
}
