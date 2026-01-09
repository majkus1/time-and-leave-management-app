'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

interface LegalHeaderProps {
	lang?: 'pl' | 'en';
}

export default function LegalHeader({ lang = 'pl' }: LegalHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [legalDropdownOpen, setLegalDropdownOpen] = useState(false)
	const pathname = usePathname()
	const toggleMenu = () => setMenuOpen(prev => !prev)

	const isPL = lang === 'pl'

	// Funkcja do przekierowania na odpowiednią wersję językową aktualnej strony
	const getAlternateLanguageUrl = () => {
		if (pathname?.startsWith('/en/')) {
			// Jesteśmy na EN, przekieruj na PL
			if (pathname === '/en/terms') return '/terms'
			if (pathname === '/en/privacy') return '/privacy'
			if (pathname === '/en/dpa') return '/dpa'
			return '/'
		} else {
			// Jesteśmy na PL, przekieruj na EN
			if (pathname === '/terms') return '/en/terms'
			if (pathname === '/privacy') return '/en/privacy'
			if (pathname === '/dpa') return '/en/dpa'
			return '/en'
		}
	}

	return (
		<>
			<header className="bg-white top-0 z-50 w-full flex justify-between headerpromotionmenu" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link
						href={isPL ? "/" : "/en"}
						className="logoinmenu text-2xl font-bold text-blue-700 companyname"
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden lg:flex space-x-8 navdesktop">
						<Link
							href={isPL ? "/#oaplikacji" : "/en#aboutapp"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{isPL ? 'O Aplikacji' : 'About the App'}
						</Link>
						<Link
							href={isPL ? "/#cennik" : "/en#prices"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{isPL ? 'Cennik' : 'Pricing'}
						</Link>
						<Link
							href={isPL ? "/#kontakt" : "/en#contact"}
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							{isPL ? 'Kontakt' : 'Contact'}
						</Link>
						<Link
							href={isPL ? "/blog" : "/en/blog"}
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
								{isPL ? 'Regulaminy' : 'Legal'}
								<svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{legalDropdownOpen && (
								<div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
									<Link
										href={isPL ? "/terms" : "/en/terms"}
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										{isPL ? 'Regulamin' : 'Terms of Service'}
									</Link>
									<Link
										href={isPL ? "/privacy" : "/en/privacy"}
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										{isPL ? 'Polityka prywatności' : 'Privacy Policy'}
									</Link>
									<Link
										href={isPL ? "/dpa" : "/en/dpa"}
										className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
										{isPL ? 'Umowa DPA' : 'Data Processing Agreement'}
									</Link>
								</div>
							)}
						</div>
						<Link
							href="https://app.planopia.pl/"
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition">
							{isPL ? 'Logowanie' : 'Login'}
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu">
							{isPL ? 'Załóż darmowy zespół' : 'Create a free team'}
						</Link>
						<Link 
							href={getAlternateLanguageUrl()} 
							className="flex items-center languagechoose">
							<img 
								src={isPL ? "/img/united-kingdom.webp" : "/img/poland.webp"} 
								alt={isPL ? "English version" : "Wersja Polska"} 
								className="w-6 h-6" 
							/>
						</Link>
					</nav>

					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={toggleMenu}
				lang={lang}
				menuItems={[
					{ href: isPL ? "/#oaplikacji" : "/en#aboutapp", label: isPL ? 'O Aplikacji' : 'About the App' },
					{ href: isPL ? "/#cennik" : "/en#prices", label: isPL ? 'Cennik' : 'Pricing' },
					{ href: isPL ? "/#kontakt" : "/en#contact", label: isPL ? 'Kontakt' : 'Contact' },
					{ href: isPL ? "/blog" : "/en/blog", label: 'Blog' },
				]}
				legalItems={[
					{ href: isPL ? "/terms" : "/en/terms", label: isPL ? 'Regulamin' : 'Terms of Service' },
					{ href: isPL ? "/privacy" : "/en/privacy", label: isPL ? 'Polityka prywatności' : 'Privacy Policy' },
					{ href: isPL ? "/dpa" : "/en/dpa", label: isPL ? 'Umowa DPA' : 'Data Processing Agreement' },
				]}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: getAlternateLanguageUrl(),
					flagSrc: isPL ? "/img/united-kingdom.webp" : "/img/poland.webp",
					alt: isPL ? "English version" : "Wersja Polska"
				}}
			/>
		</>
	)
}
