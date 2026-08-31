'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '@/data/landingNav'
import { resetBodyScrollLock } from '@/lib/bodyScrollLock'

type Locale = 'pl' | 'en'

const headerCopy = {
	pl: {
		homeHref: '/',
		nav: [
			{ href: '#oaplikacji', label: 'O Aplikacji' },
			{ href: '#asystent-ai', label: 'Asystent AI' },
			{ href: '#cennik', label: 'Cennik' },
			{ href: '/blog', label: 'Blog', isLink: true },
			{ href: '#kontakt', label: 'Kontakt' },
		],
		login: 'Logowanie',
		register: 'Załóż darmowy zespół',
		languageHref: '/en',
		languageFlag: '/img/united-kingdom.webp',
		languageAlt: 'English version',
	},
	en: {
		homeHref: '/en',
		nav: [
			{ href: '#aboutapp', label: 'About the App' },
			{ href: '#ai-assistant', label: 'AI Assistant' },
			{ href: '#prices', label: 'Pricing' },
			{ href: '/en/blog', label: 'Blog', isLink: true },
			{ href: '#contact', label: 'Contact' },
		],
		login: 'Login',
		register: 'Create your free team',
		languageHref: '/',
		languageFlag: '/img/poland.webp',
		languageAlt: 'Wersja Polska',
	},
} as const

export default function LandingHeader({ locale }: { locale: Locale }) {
	const t = headerCopy[locale]
	const [menuOpen, setMenuOpen] = useState(false)
	const [buttonState, setButtonState] = useState(false)
	const menuCloseHandlerRef = useRef<(() => void) | null>(null)

	const closeMenu = () => {
		resetBodyScrollLock()
		setMenuOpen(false)
		setButtonState(false)
	}

	const handleMenuClick = () => {
		if (menuOpen && menuCloseHandlerRef.current) {
			setButtonState(false)
			menuCloseHandlerRef.current()
		} else {
			setMenuOpen(true)
			setButtonState(true)
		}
	}

	const handleCloseRequest = useCallback((closeHandler: () => void) => {
		menuCloseHandlerRef.current = closeHandler
	}, [])

	return (
		<>
			<header className="landing-polished-header bg-white top-0 z-50 w-full flex justify-between headerpromotionmenu" id="planopiaheader">
				<div
					className="landing-polished-header-inner max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent"
					style={{ maxWidth: '1350px' }}
				>
					<Link href={t.homeHref} className="logoinmenu text-2xl font-bold text-blue-700 companyname" style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} width={180} height={40} />
					</Link>
					<nav className="landing-polished-nav hidden desktop:flex navdesktop">
						{t.nav.slice(0, MOBILE_INDUSTRY_INSERT_INDEX).map(item =>
							'isLink' in item && item.isLink ? (
								<Link key={item.href} href={item.href} className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
									{item.label}
								</Link>
							) : (
								<a key={item.href} href={item.href} className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
									{item.label}
								</a>
							)
						)}
						<LandingSolutionsDropdown locale={locale} />
						<LandingIndustriesDropdown locale={locale} />
						{t.nav.slice(MOBILE_INDUSTRY_INSERT_INDEX).map(item =>
							'isLink' in item && item.isLink ? (
								<Link key={item.href} href={item.href} className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
									{item.label}
								</Link>
							) : (
								<a key={item.href} href={item.href} className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
									{item.label}
								</a>
							)
						)}
						<Link
							href="https://app.planopia.pl/"
							onClick={closeMenu}
							className="landing-polished-login bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
						>
							{t.login}
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={closeMenu}
							className="landing-polished-register bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							{t.register}
						</Link>
						<Link href={t.languageHref} className="landing-polished-language flex items-center languagechoose">
							<img src={t.languageFlag} alt={t.languageAlt} className="w-6 h-6" width={24} height={24} />
						</Link>
					</nav>

					<HamburgerButton isOpen={buttonState} onClick={handleMenuClick} />
				</div>
			</header>

			<MobileMenu
				isOpen={menuOpen}
				onClose={closeMenu}
				onCloseRequest={handleCloseRequest}
				lang={locale}
				menuItems={locale === 'pl' ? landingMobileNavItemsPl() : landingMobileNavItemsEn()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig(locale)}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: t.languageHref,
					flagSrc: t.languageFlag,
					alt: t.languageAlt,
				}}
			/>
		</>
	)
}
