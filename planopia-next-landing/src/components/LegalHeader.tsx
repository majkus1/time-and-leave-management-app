'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsEn,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'

interface LegalHeaderProps {
	lang?: 'pl' | 'en';
}

export default function LegalHeader({ lang = 'pl' }: LegalHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false)
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
			if (pathname === '/en/complaints') return '/reklamacje'
			return '/'
		} else {
			// Jesteśmy na PL, przekieruj na EN
			if (pathname === '/terms') return '/en/terms'
			if (pathname === '/privacy') return '/en/privacy'
			if (pathname === '/dpa') return '/en/dpa'
			if (pathname === '/reklamacje') return '/en/complaints'
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
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link
							href={isPL ? "/#oaplikacji" : "/en#aboutapp"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							{isPL ? 'O Aplikacji' : 'About the App'}
						</Link>
						<Link
							href={isPL ? '/#asystent-ai' : '/en#ai-assistant'}
							className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							{isPL ? 'Asystent AI' : 'AI Assistant'}
						</Link>
						<Link
							href={isPL ? "/#cennik" : "/en#prices"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							{isPL ? 'Cennik' : 'Pricing'}
						</Link>
						<LandingSolutionsDropdown locale={isPL ? 'pl' : 'en'} />
						<LandingIndustriesDropdown locale={isPL ? 'pl' : 'en'} />
						<Link
							href={isPL ? "/blog" : "/en/blog"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Blog
						</Link>
						<Link
							href={isPL ? "/#kontakt" : "/en#contact"}
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							{isPL ? 'Kontakt' : 'Contact'}
						</Link>
						<Link
							href="https://app.planopia.pl/"
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition">
							{isPL ? 'Logowanie' : 'Login'}
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu">
							{isPL ? 'Załóż darmowy zespół' : 'Create your free team'}
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
				menuItems={isPL ? landingMobileNavItemsPl() : landingMobileNavItemsEn()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig(isPL ? 'pl' : 'en')}
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
