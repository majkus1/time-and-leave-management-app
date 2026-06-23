import { useTranslation } from 'react-i18next'
import SidebarThemeButton from './SidebarThemeButton'

const lngs = {
	en: { nativeName: 'EN', flag: '/img/united-kingdom.png' },
	pl: { nativeName: 'PL', flag: '/img/poland.png' },
}

export default function AuthPageTopBar() {
	const { i18n } = useTranslation()

	return (
		<div className="auth-top-bar">
			<div className="auth-top-bar__langs" role="group" aria-label="Language">
				{Object.keys(lngs).map(lng => (
					<button
						key={lng}
						type="button"
						className={`auth-lang-btn${i18n.resolvedLanguage === lng ? ' auth-lang-btn--active' : ''}`}
						onClick={() => i18n.changeLanguage(lng)}
						aria-label={`Change language to ${lng}`}
						aria-pressed={i18n.resolvedLanguage === lng}
					>
						<img src={lngs[lng].flag} alt="" className="auth-lang-btn__flag" />
					</button>
				))}
			</div>
			<SidebarThemeButton />
		</div>
	)
}
