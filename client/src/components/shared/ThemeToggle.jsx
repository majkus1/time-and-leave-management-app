import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { THEME_SWITCHER_ENABLED } from '../../utils/themeStorage'

export default function ThemeToggle({ className = '' }) {
	const { t } = useTranslation()
	const { preference, setTheme } = useTheme()

	if (!THEME_SWITCHER_ENABLED) return null

	return (
		<div className={`po-theme-toggle ${className}`.trim()} role="group" aria-label={t('settings.themeTitle')}>
			<button
				type="button"
				className={`po-theme-toggle__btn${preference === 'light' ? ' po-theme-toggle__btn--active' : ''}`}
				onClick={() => setTheme('light')}
				aria-pressed={preference === 'light'}
			>
				{t('settings.themeLight')}
			</button>
			<button
				type="button"
				className={`po-theme-toggle__btn${preference === 'dark' ? ' po-theme-toggle__btn--active' : ''}`}
				onClick={() => setTheme('dark')}
				aria-pressed={preference === 'dark'}
			>
				{t('settings.themeDark')}
			</button>
			<button
				type="button"
				className={`po-theme-toggle__btn${preference === 'system' ? ' po-theme-toggle__btn--active' : ''}`}
				onClick={() => setTheme('system')}
				aria-pressed={preference === 'system'}
			>
				{t('settings.themeSystem')}
			</button>
		</div>
	)
}
