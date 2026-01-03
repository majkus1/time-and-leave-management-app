'use client'

import { useState } from 'react'
import Link from 'next/link'

interface BlogHeaderProps {
	lang?: 'pl' | 'en'
	enUrl?: string
	plUrl?: string
}

export default function BlogHeader({ lang = 'pl', enUrl = '/en/blog/comprehensive-company-management-app', plUrl = '/blog/kompleksowa-aplikacja-do-zarzadzania-firma' }: BlogHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)

	const isPolish = lang === 'pl'

	return (
		<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
			<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
				<Link 
					href={isPolish ? "/" : "/en"} 
					className="logoinmenu text-2xl font-bold text-blue-700 companyname" 
					style={{ marginBottom: '0px' }}>
					<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
				</Link>
				<nav className="hidden flex space-x-8 navdesktop">
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
					<Link 
						href={isPolish ? enUrl : plUrl} 
						className="flex items-center languagechoose">
						<img 
							src={isPolish ? "/img/united-kingdom.webp" : "/img/poland.webp"} 
							alt={isPolish ? "English version" : "Wersja polska"} 
							className="w-6 h-6" 
						/>
					</Link>
				</nav>

				<button
					className="lg:hidden text-gray-700 text-3xl focus:outline-none"
					onClick={toggleMenu}
					style={{ fontSize: '36px' }}>
					{menuOpen ? '✕' : '☰'}
				</button>
			</div>
			{menuOpen && (
				<div
					className="navmobile lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 flex flex-col items-start">
					<Link
						href={isPolish ? "/#oaplikacji" : "/en#aboutapp"}
						onClick={toggleMenu}
						className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
						{isPolish ? "O Aplikacji" : "About the App"}
					</Link>
					<Link
						href={isPolish ? "/#cennik" : "/en#prices"}
						onClick={toggleMenu}
						className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
						{isPolish ? "Cennik" : "Pricing"}
					</Link>
					<Link
						href={isPolish ? "/#kontakt" : "/en#contact"}
						onClick={toggleMenu}
						className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
						{isPolish ? "Kontakt" : "Contact"}
					</Link>
					<Link
						href={isPolish ? "/blog" : "/en/blog"}
						className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4"
						onClick={toggleMenu}>
						Blog
					</Link>
					<Link
						href="https://app.planopia.pl/"
						onClick={toggleMenu}
						className="w-full text-center bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded mb-4 hover:bg-blue-50 hover:text-blue-700 transition"
					>
						{isPolish ? "Logowanie" : "Login"}
					</Link>

					<Link
						href="https://app.planopia.pl/team-registration"
						onClick={toggleMenu}
						className="ctamenu w-full text-center bg-green-600 text-white font-semibold py-2 px-4 rounded mb-4 shadow hover:bg-green-700 transition"
					>
						{isPolish ? "Załóż darmowy zespół" : "Create a free team"}
					</Link>
					<Link
						href={isPolish ? enUrl : plUrl}
						className="flex items-center languagechoose"
						style={{ marginTop: '15px' }}
						onClick={toggleMenu}>
						<img 
							src={isPolish ? "/img/united-kingdom.webp" : "/img/poland.webp"} 
							alt={isPolish ? "English version" : "Wersja polska"} 
							className="w-6 h-6" 
						/>
					</Link>
				</div>
			)}
		</header>
	)
}

