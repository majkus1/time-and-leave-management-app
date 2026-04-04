'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'

interface BlogHeaderProps {
	lang?: 'pl' | 'en'
	enUrl?: string
	plUrl?: string
	hideLanguageSwitcher?: boolean
}

export default function BlogHeader({ lang = 'pl', enUrl = '/en/blog/comprehensive-company-management-app', plUrl = '/blog/kompleksowa-aplikacja-do-zarzadzania-firma', hideLanguageSwitcher = false }: BlogHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [buttonState, setButtonState] = useState(false) // Separate state for button (changes immediately)
	const menuCloseHandlerRef = useRef<(() => void) | null>(null)
	
	const toggleMenu = () => {
		setMenuOpen(prev => !prev)
		setButtonState(prev => !prev) // Keep button in sync
	}
	
	// Close menu and sync button state
	const closeMenu = () => {
		setMenuOpen(false)
		setButtonState(false) // Always sync button state when closing menu
	}
	
	const handleMenuClick = () => {
		if (menuOpen && menuCloseHandlerRef.current) {
			// Immediately change button state (X -> hamburger) before animation
			setButtonState(false)
			// Use animated close handler for menu animation
			menuCloseHandlerRef.current()
		} else {
			// Open menu normally
			setMenuOpen(true)
			setButtonState(true) // Keep button in sync
		}
	}
	
	// Stable callback that doesn't change on every render
	const handleCloseRequest = useCallback((closeHandler: () => void) => {
		menuCloseHandlerRef.current = closeHandler
	}, [])

	const isPolish = lang === 'pl'

	return (
		<>
			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link 
						href={isPolish ? "/" : "/en"} 
						className="logoinmenu text-2xl font-bold text-blue-700 companyname" 
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link
							href={isPolish ? "/#oaplikacji" : "/en#aboutapp"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							{isPolish ? "O Aplikacji" : "About the App"}
						</Link>
						<Link
							href={isPolish ? '/#asystent-ai' : '/en#ai-assistant'}
							className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							{isPolish ? 'Asystent AI' : 'AI Assistant'}
						</Link>
						<Link
							href={isPolish ? "/#cennik" : "/en#prices"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							{isPolish ? "Cennik" : "Pricing"}
						</Link>
						<LandingIndustriesDropdown locale={isPolish ? 'pl' : 'en'} />
						<Link
							href={isPolish ? "/blog" : "/en/blog"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Blog
						</Link>
						<Link
							href={isPolish ? "/#kontakt" : "/en#contact"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							{isPolish ? "Kontakt" : "Contact"}
						</Link>
						<Link
							href="https://app.planopia.pl/"
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
						>
							{isPolish ? "Logowanie" : "Login"}
						</Link>

						<Link
							href="https://app.planopia.pl/team-registration"
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							{isPolish ? "Załóż darmowy zespół" : "Create your free team"}
						</Link>
						{!hideLanguageSwitcher && (
							<Link 
								href={isPolish ? enUrl : plUrl} 
								className="flex items-center languagechoose">
								<img 
									src={isPolish ? "/img/united-kingdom.webp" : "/img/poland.webp"} 
									alt={isPolish ? "English version" : "Wersja polska"} 
									className="w-6 h-6" 
								/>
							</Link>
						)}
					</nav>

					<HamburgerButton isOpen={buttonState} onClick={handleMenuClick} />
				</div>
			</header>
			<div className="header-fixed-spacer" aria-hidden="true" />

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={closeMenu}
				onCloseRequest={handleCloseRequest}
				lang={lang}
				menuItems={
					isPolish
						? landingMobileNavItemsPl({ blogHref: '/blog' })
						: landingMobileNavItemsEn({ blogHref: '/en/blog' })
				}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig(isPolish ? 'pl' : 'en')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={!hideLanguageSwitcher ? {
					href: isPolish ? enUrl : plUrl,
					flagSrc: isPolish ? "/img/united-kingdom.webp" : "/img/poland.webp",
					alt: isPolish ? "English version" : "Wersja polska"
				} : undefined}
			/>
		</>
	)
}

