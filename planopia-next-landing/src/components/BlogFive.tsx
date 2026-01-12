'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

function BlogFive() {
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
						"headline": "Elektroniczna ewidencja czasu pracy - kompletny przewodnik | Planopia",
						"url": "https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy",
						"datePublished": "2024-10-18",
						"dateModified": "2024-10-18",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Planopia",
							"logo": {
								"@type": "ImageObject",
								"url": "https://planopia.pl/img/new-logoplanopia.png"
							}
						},
						"description": "Kompletny przewodnik po elektronicznej ewidencji czasu pracy. Dowiedz się jak wybrać najlepszy program do ewidencji czasu pracy dla swojej firmy.",
						"image": "https://planopia.pl/img/desktopnew.webp"
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
						<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
					</Link>
					<nav className="hidden flex space-x-8 navdesktop">
						<Link
							href="/#oaplikacji"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							O Aplikacji
						</Link>
						<Link
							href="/#cennik"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Cennik
						</Link>
						<Link
							href="/#kontakt"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							Kontakt
						</Link>
						<Link
							href="/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
							href="https://app.planopia.pl"
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
						<Link href="/en/blog/electronic-time-tracking" className="flex items-center languagechoose">
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
				menuItems={[
					{ href: '/#oaplikacji', label: 'O Aplikacji' },
					{ href: '/#cennik', label: 'Cennik' },
					{ href: '/#kontakt', label: 'Kontakt' },
					{ href: '/blog', label: 'Blog' },
				]}
				legalItems={[
					{ href: '/terms', label: 'Regulamin' },
					{ href: '/privacy', label: 'Polityka prywatności' },
					{ href: '/dpa', label: 'Umowa DPA' },
				]}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/en/blog/electronic-time-tracking',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 text-center mt-4">
								Elektroniczna ewidencja czasu pracy - kompletny przewodnik
							</h1>
							<p className="text-xl text-gray-600 text-center max-w-4xl mx-auto mb-8">
								Dowiedz się wszystkiego o elektronicznej ewidencji czasu pracy. Kompletny przewodnik po wyborze najlepszego programu do ewidencji czasu pracy dla Twojej firmy.
							</p>
							<div className="text-center">
								<Link
									href="https://app.planopia.pl/team-registration"
									className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
								>
									Wypróbuj Planopię za darmo
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* MAIN CONTENT */}
			<article className="px-4 py-16 bg-white">
				<div className="max-w-4xl mx-auto">
					
					{/* Introduction */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Czym jest elektroniczna ewidencja czasu pracy?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Elektroniczna ewidencja czasu pracy to nowoczesny system rejestrowania godzin pracy pracowników za pomocą specjalistycznego oprogramowania. 
							Zastępuje tradycyjne metody jak papierowe listy obecności czy arkusze kalkulacyjne Excel.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Program do ewidencji czasu pracy</strong> automatycznie oblicza godziny pracy, nadgodziny, dni wolne i generuje raporty, 
							co znacznie usprawnia proces zarządzania czasem pracy w firmie.
						</p>
					</div>

					{/* Benefits */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Korzyści z elektronicznej ewidencji czasu pracy
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Automatyzacja procesów</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Automatyczne obliczanie godzin pracy</li>
									<li>• Eliminacja błędów ludzkich</li>
									<li>• Szybsze przetwarzanie danych</li>
									<li>• Integracja z systemami HR</li>
								</ul>
							</div>
							<div className="bg-green-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">💰 Oszczędności kosztów</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Redukcja czasu administracyjnego</li>
									<li>• Mniej błędów w rozliczeniach</li>
									<li>• Automatyczne raporty</li>
									<li>• Zgodność z przepisami prawa</li>
								</ul>
							</div>
							<div className="bg-purple-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Lepsze raportowanie</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Szczegółowe raporty czasowe</li>
									<li>• Analiza produktywności</li>
									<li>• Monitoring projektów</li>
									<li>• Eksport do różnych formatów</li>
								</ul>
							</div>
							<div className="bg-orange-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🔒 Bezpieczeństwo danych</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Szyfrowane przechowywanie</li>
									<li>• Kontrola dostępu</li>
									<li>• Regularne kopie zapasowe</li>
									<li>• Zgodność z RODO</li>
								</ul>
							</div>
						</div>
					</div>

					{/* How to choose */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Jak wybrać najlepszy program do ewidencji czasu pracy?
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">1. Określ potrzeby firmy</h3>
								<p className="text-gray-700">
									Przed wyborem programu do ewidencji czasu pracy zastanów się nad specyfiką swojej firmy. 
									Czy potrzebujesz prostego systemu dla małego zespołu, czy zaawansowanego rozwiązania dla dużej organizacji?
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">2. Sprawdź funkcjonalności</h3>
								<p className="text-gray-700">
									Najlepszy program do ewidencji czasu pracy powinien oferować: rejestrację czasu w czasie rzeczywistym, 
									automatyczne obliczanie nadgodzin, integrację z systemami HR, raportowanie i eksport danych.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">3. Zwróć uwagę na łatwość użycia</h3>
								<p className="text-gray-700">
									Elektroniczna ewidencja czasu pracy powinna być intuicyjna dla wszystkich pracowników. 
									Sprawdź czy interfejs jest przyjazny i czy nie wymaga długiego szkolenia.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">4. Sprawdź bezpieczeństwo i zgodność</h3>
								<p className="text-gray-700">
									Program do ewidencji czasu pracy musi być zgodny z polskim prawem pracy i RODO. 
									Sprawdź czy oferuje szyfrowanie danych i regularne kopie zapasowe.
								</p>
							</div>
						</div>
					</div>

					{/* Planopia section */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Planopia - najlepszy program do elektronicznej ewidencji czasu pracy
						</h2>
						<div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
							<h3 className="text-2xl font-bold text-gray-900 mb-4">Dlaczego Planopia?</h3>
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">✅ Pełna funkcjonalność</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• Elektroniczna ewidencja czasu pracy</li>
										<li>• Zarządzanie urlopami</li>
										<li>• Automatyczne raporty</li>
										<li>• Integracja z kalendarzami</li>
									</ul>
								</div>
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">✅ Darmowa dla małych firm</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• Do 6 użytkowników bez opłat</li>
										<li>• Pełna funkcjonalność</li>
										<li>• Bez ukrytych kosztów</li>
										<li>• Wsparcie techniczne</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* FAQ */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Często zadawane pytania o elektroniczną ewidencję czasu pracy
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy elektroniczna ewidencja czasu pracy jest obowiązkowa?
								</h3>
								<p className="text-gray-700">
									Tak, zgodnie z polskim prawem pracy każdy pracodawca musi prowadzić ewidencję czasu pracy swoich pracowników. 
									Elektroniczna ewidencja czasu pracy jest pełnoprawną metodą spełnienia tego obowiązku.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Jak długo trwa wdrożenie programu do ewidencji czasu pracy?
								</h3>
								<p className="text-gray-700">
									Wdrożenie elektronicznej ewidencji czasu pracy w Planopii trwa zaledwie kilka minut. 
									Możesz rozpocząć korzystanie z systemu natychmiast po rejestracji zespołu.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy program do ewidencji czasu pracy jest bezpieczny?
								</h3>
								<p className="text-gray-700">
									Planopia oferuje najwyższe standardy bezpieczeństwa: szyfrowanie danych, bezpieczne serwery, 
									regularne kopie zapasowe i pełną zgodność z RODO.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy mogę eksportować dane z programu do ewidencji czasu pracy?
								</h3>
								<p className="text-gray-700">
									Tak! Planopia umożliwia eksport wszystkich danych do formatów PDF i Excel. 
									Twoje dane zawsze pozostają Twoje i możesz je pobrać w każdej chwili.
								</p>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
						<h2 className="text-3xl font-bold text-gray-900 mb-4 justify-center">
							Gotowy na elektroniczną ewidencję czasu pracy?
						</h2>
						<p className="text-xl text-gray-700 mb-6">
							Rozpocznij zarządzanie urlopami już dziś i uporządkuj planowanie w Twojej firmie!
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
						>
							Wypróbuj Planopię za darmo
						</Link>
					</div>
				</div>
			</article>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default BlogFive
