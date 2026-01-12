'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

interface BlogHeaderProps {
	lang?: 'pl' | 'en'
	enUrl?: string
	plUrl?: string
	hideLanguageSwitcher?: boolean
}

export default function BlogHeader({ lang = 'pl', enUrl = '/en/blog/comprehensive-company-management-app', plUrl = '/blog/kompleksowa-aplikacja-do-zarzadzania-firma', hideLanguageSwitcher = false }: BlogHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [buttonState, setButtonState] = useState(false) // Separate state for button (changes immediately)
	const [legalDropdownOpen, setLegalDropdownOpen] = useState(false)
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
					<nav className="hidden lg:flex space-x-8 navdesktop">
						<Link
							href={isPolish ? "/#oaplikacji" : "/en#aboutapp"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{isPolish ? "O Aplikacji" : "About the App"}
						</Link>
						<Link
							href={isPolish ? "/#cennik" : "/en#prices"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{isPolish ? "Cennik" : "Pricing"}
						</Link>
						<Link
							href={isPolish ? "/#kontakt" : "/en#contact"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{isPolish ? "Kontakt" : "Contact"}
						</Link>
						<Link
							href={isPolish ? "/blog" : "/en/blog"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Blog
						</Link>
						{/* Dropdown Regulaminy */}
						<div 
							className="relative"
							onMouseEnter={() => setLegalDropdownOpen(true)}
							onMouseLeave={() => setLegalDropdownOpen(false)}
						>
							<button className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition flex items-center">
								{isPolish ? 'Regulaminy' : 'Legal'}
								<svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{legalDropdownOpen && (
								<div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
									<Link
										href={isPolish ? "/terms" : "/en/terms"}
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										{isPolish ? 'Regulamin' : 'Terms of Service'}
									</Link>
									<Link
										href={isPolish ? "/privacy" : "/en/privacy"}
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										{isPolish ? 'Polityka prywatności' : 'Privacy Policy'}
									</Link>
									<Link
										href={isPolish ? "/dpa" : "/en/dpa"}
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										{isPolish ? 'Umowa DPA' : 'Data Processing Agreement'}
									</Link>
								</div>
							)}
						</div>
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
							{isPolish ? "Załóż darmowy zespół" : "Create a free team"}
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

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={closeMenu}
				onCloseRequest={handleCloseRequest}
				lang={lang}
				menuItems={[
					{ href: isPolish ? "/#oaplikacji" : "/en#aboutapp", label: isPolish ? "O Aplikacji" : "About the App" },
					{ href: isPolish ? "/#cennik" : "/en#prices", label: isPolish ? "Cennik" : "Pricing" },
					{ href: isPolish ? "/#kontakt" : "/en#contact", label: isPolish ? "Kontakt" : "Contact" },
					{ href: isPolish ? "/blog" : "/en/blog", label: 'Blog' },
				]}
				legalItems={[
					{ href: isPolish ? "/terms" : "/en/terms", label: isPolish ? 'Regulamin' : 'Terms of Service' },
					{ href: isPolish ? "/privacy" : "/en/privacy", label: isPolish ? 'Polityka prywatności' : 'Privacy Policy' },
					{ href: isPolish ? "/dpa" : "/en/dpa", label: isPolish ? 'Umowa DPA' : 'Data Processing Agreement' },
				]}
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

