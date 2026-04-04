'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import BlogFreeAppHeroVideo from './BlogFreeAppHeroVideo'

function BlogFour() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)

	return (
		<>
			{/* Schema.org JSON-LD */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Article",
						"headline": "Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia",
						"url": "https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy",
						"datePublished": "2024-10-18",
						"dateModified": "2026-03-27",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Planopia",
							"logo": {
								"@type": "ImageObject",
								"url": "https://planopia.pl/img/new-logoplanopia.webp"
							}
						},
						"description": "Planopia: 30 dni pełnej aplikacji dla zespołu do 5 osób, bez karty na start; potem darmowa ewidencja do 5 kont lub pakiety płatne — urlopy, grafik, czat i Asystent AI w cenniku.",
						"image": "https://planopia.pl/img/desktopnews.webp"
					})
				}}
			/>

			{/* HEADER + MENU */}
			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link
						href="/"
						className="logoinmenu text-2xl font-bold text-blue-700 companyname"
						style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link
							href="/#oaplikacji"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							O Aplikacji
						</Link>
						<Link
							href="/#asystent-ai"
							className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							Asystent AI
						</Link>
						<Link
							href="/#cennik"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Cennik
						</Link>
						<LandingIndustriesDropdown locale="pl" />
						<Link
							href="/blog"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
							href="/#kontakt"
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Kontakt
						</Link>
						<Link
							href="https://app.planopia.pl/"
							onClick={toggleMenu}
							className="bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
						>
							Logowanie
						</Link>
						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition ctamenu"
						>
							Załóż darmowy zespół
						</Link>
						<Link href="/en/blog/free-time-tracking-app" className="flex items-center languagechoose">
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</nav>
					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

			{/* Professional Mobile Menu */}
			<MobileMenu
				isOpen={menuOpen}
				onClose={toggleMenu}
				lang="pl"
				menuItems={landingMobileNavItemsPl()}
				industryInsertIndex={MOBILE_INDUSTRY_INSERT_INDEX}
				{...industryMobileConfig('pl')}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/en/blog/free-time-tracking-app',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			{/* HERO */}
			<section
				className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 bg-gradient-to-br from-slate-50 via-blue-50/60 to-emerald-50/30 landing-hero-below-fixed-header"
				id="blog-free-app-welcome">
				<div className="max-w-4xl md:max-w-5xl xl:max-w-6xl mx-auto w-full">
					<div className="rounded-2xl md:rounded-3xl border border-blue-100/80 bg-white shadow-md md:shadow-lg px-6 py-9 sm:px-10 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 text-left md:text-center ring-1 ring-slate-200/60">
						<h1 className="font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 blogh1 leading-[1.2] tracking-tight max-w-5xl md:mx-auto">
							Ewidencja czasu pracy i urlopy — pierwszy miesiąc za darmo
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl md:max-w-4xl mx-0 md:mx-auto mb-6 sm:mb-8 md:mb-10 leading-snug sm:leading-relaxed">
							30 dni pełnej aplikacji dla zespołu do 5 osób —{' '}
							<strong className="font-semibold text-gray-800">bez karty na start</strong>.
							{' '}
							Potem darmowa ewidencja (5 kont) lub pakiety płatne.{' '}
							<Link href="/#cennik" className="text-blue-600 font-medium hover:underline whitespace-nowrap">
								Szczegóły w cenniku
							</Link>
							.
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition text-base sm:text-lg white-text-btn">
							Załóż darmowy zespół
						</Link>
					</div>
					<BlogFreeAppHeroVideo locale="pl" />
				</div>
			</section>

			{/* MAIN CONTENT */}
			<article className="px-4 py-16 bg-white">
				<div className="max-w-4xl mx-auto">
					
					{/* Introduction */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Dlaczego warto wybrać aplikację do ewidencji czasu pracy z okresem próbnym?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Ewidencja czasu pracy to obowiązek każdej firmy, ale tradycyjne metody często są nieefektywne i czasochłonne. 
							Excel, papierowe listy obecności czy podstawowe systemy HR generują błędy i pochłaniają cenne godziny pracy.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Planopia</strong> rozwiązuje te problemy w modelu jasnym:{' '}
							<strong>30 dni za darmo</strong> dla do 5 użytkowników, pełne funkcje, bez karty płatniczej w okresie próbnym.
						</p>
					</div>

					{/* What is Planopia */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Czym jest Planopia — aplikacja do ewidencji czasu pracy i urlopów?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Planopia to nowoczesna <strong>aplikacja do ewidencji czasu pracy i urlopów</strong>,
							zaprojektowana z myślą o małych i średnich firmach. Aplikacja działa w przeglądarce internetowej,
							więc nie wymaga instalacji oprogramowania na komputerach pracowników.
						</p>
						<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
							<p className="text-lg text-blue-800 font-semibold">
								✅ Pierwszy miesiąc za darmo — do 5 użytkowników, pełna funkcjonalność
							</p>
							<p className="text-blue-700 mt-2">
								30 dni pełnego dostępu bez karty — potem darmowa ewidencja lub plan w{' '}
								<Link href="/#cennik" className="underline font-medium">cenniku</Link>.
							</p>
						</div>
					</div>

					{/* Features */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Funkcje darmowej aplikacji do ewidencji czasu pracy
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Ewidencja czasu pracy</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Rejestracja godzin pracy w czasie rzeczywistym</li>
									<li>• Automatyczne obliczanie nadgodzin</li>
									<li>• Kalendarz pracy z wizualizacją</li>
									<li>• Eksport danych do PDF i Excel</li>
								</ul>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏖️ Zarządzanie urlopami</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Wnioski urlopowe online</li>
									<li>• System akceptacji przez przełożonych</li>
									<li>• Kalendarz urlopów zespołu</li>
									<li>• Powiadomienia email</li>
								</ul>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📱 Dostępność</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Aplikacja PWA (Progressive Web App)</li>
									<li>• Działanie na wszystkich urządzeniach</li>
									<li>• Synchronizacja w czasie rzeczywistym</li>
								</ul>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🔒 Bezpieczeństwo</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Szyfrowane połączenia SSL</li>
									<li>• Bezpieczne logowanie</li>
									<li>• Regularne kopie zapasowe</li>
									<li>• Zgodność z RODO</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Comparison */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Dlaczego Planopia to najlepsza darmowa aplikacja do ewidencji czasu pracy?
						</h2>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse border border-gray-300">
								<thead>
									<tr className="bg-gray-100">
										<th className="border border-gray-300 p-4 text-left">Funkcja</th>
										<th className="border border-gray-300 p-4 text-center">Planopia (próba + darmowy plan ewidencji)</th>
										<th className="border border-gray-300 p-4 text-center">Konkurencja</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Ewidencja czasu pracy</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Pełna funkcjonalność</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Ograniczona</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Zarządzanie urlopami</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Kompletny system</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Brak lub płatne</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Raporty PDF</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Bez ograniczeń</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Ograniczone</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Wsparcie techniczne</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Email + chat</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Tylko płatne</td>
									</tr>
									<tr>
										<td className="border border-gray-300 p-4 font-semibold">Aktualizacje</td>
										<td className="border border-gray-300 p-4 text-center text-green-600">✅ Regularne</td>
										<td className="border border-gray-300 p-4 text-center text-red-600">❌ Rzadkie</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* How to start */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Jak zacząć korzystać z Planopii (próba i darmowa ewidencja)?
						</h2>
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center p-6 bg-green-50 rounded-lg">
								<div className="text-4xl font-bold text-green-600 mb-2">1</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Załóż darmowy zespół</h3>
								<p className="text-gray-700">
									Kliknij &quot;Załóż darmowy zespół&quot; i wypełnij podstawowe informacje o firmie.
								</p>
							</div>
							<div className="text-center p-6 bg-blue-50 rounded-lg">
								<div className="text-4xl font-bold text-blue-600 mb-2">2</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Dodaj pracowników</h3>
								<p className="text-gray-700">
									Zaproś członków zespołu i przydziel im odpowiednie uprawnienia.
								</p>
							</div>
							<div className="text-center p-6 bg-purple-50 rounded-lg">
								<div className="text-4xl font-bold text-purple-600 mb-2">3</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Zacznij pracę</h3>
								<p className="text-gray-700">
									Rozpocznij ewidencję czasu pracy i zarządzanie urlopami już dziś!
								</p>
							</div>
						</div>
					</div>

					{/* FAQ */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Często zadawane pytania o darmową aplikację do ewidencji czasu pracy
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy jest okres próbny?
								</h3>
								<p className="text-gray-700">
									Tak. Przez 30 dni masz pełne funkcje za darmo w zespole do 5 użytkowników (limit wiadomości Asystenta AI w tym czasie).
									Bez karty płatniczej i bez zobowiązania — zobacz <Link href="/#cennik" className="text-blue-600 hover:underline">cennik</Link>.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Jak długo trwa darmowy okres?
								</h3>
								<p className="text-gray-700">
									<strong>30 dni</strong> — pierwszy miesiąc z pełnymi funkcjami dla do 5 użytkowników.
									Potem możesz zostać na <strong>bezpłatnym planie ewidencji czasu pracy</strong> (do 5 aktywnych kont) albo wykupić pakiet z urlopami i pozostałymi modułami — szczegóły w <Link href="/#cennik" className="text-blue-600 hover:underline">cenniku</Link>.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy moje dane są bezpieczne?
								</h3>
								<p className="text-gray-700">
									Absolutnie! Wszystkie dane są szyfrowane, przechowywane na bezpiecznych serwerach 
									i regularnie archiwizowane. Aplikacja jest zgodna z RODO.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy mogę eksportować dane?
								</h3>
								<p className="text-gray-700">
									Tak! Możesz eksportować wszystkie dane do formatów PDF i Excel bez ograniczeń. 
									Twoje dane zawsze pozostają Twoje.
								</p>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-5 sm:p-8 rounded-2xl shadow-sm">
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 justify-center leading-snug">
							Gotowy na darmową aplikację do ewidencji czasu pracy?
						</h2>
						<p className="text-sm sm:text-base md:text-lg text-gray-700 mb-5 sm:mb-6 max-w-2xl mx-auto leading-snug sm:leading-relaxed">
							Rozpocznij zarządzanie urlopami już dziś i uporządkuj planowanie w Twojej firmie!
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-sm sm:text-base md:text-lg white-text-btn">
							Załóż darmowy zespół
						</Link>
					</div>
				</div>
			</article>

			{/* FOOTER */}
		</>
	)
}

export default BlogFour
