'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

function BlogSix() {
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
						"headline": "Zarządzanie urlopami w firmie - kompletny przewodnik | Planopia",
						"url": "https://planopia.pl/blog/zarzadzanie-urlopami",
						"datePublished": "2024-10-25",
						"dateModified": "2024-10-25",
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
						"description": "Kompletny przewodnik po zarządzaniu urlopami w firmie. Planopia: 30 dni za darmo, do 5 użytkowników, pełne funkcje.",
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
					<nav className="hidden flex space-x-8 navdesktop">
						<Link
							href="/#oaplikacji"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition">
							O Aplikacji
						</Link>
						<Link
							href="/#asystent-ai"
							className="cursor-pointer text-gray-700 font-medium hover:text-indigo-600 transition">
							Asystent AI
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
							Rozpocznij okres próbny
						</Link>
						<Link href="/en/blog/leave-management" className="flex items-center languagechoose">
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
					{ href: '/#asystent-ai', label: 'Asystent AI' },
					{ href: '/#cennik', label: 'Cennik' },
					{ href: '/#kontakt', label: 'Kontakt' },
					{ href: '/blog', label: 'Blog' },
				]}
				loginHref="https://app.planopia.pl/"
				registerHref="https://app.planopia.pl/team-registration"
				languageSwitcher={{
					href: '/en/blog/leave-management',
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
								Zarządzanie urlopami w firmie - kompletny przewodnik
							</h1>
							<p className="text-xl text-gray-600 text-center max-w-4xl mx-auto mb-8">
								Dowiedz się, jak efektywnie zarządzać urlopami w swojej firmie, minimalizując błędy i zwiększając satysfakcję pracowników.
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
							Czym jest zarządzanie urlopami w firmie?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Zarządzanie urlopami to proces planowania, ewidencjonowania i kontrolowania nieobecności pracowników w firmie. 
							Obejmuje ono nie tylko urlopy wypoczynkowe, ale także inne rodzaje nieobecności jak urlopy na żądanie, 
							chorobowe, opieka nad dzieckiem czy urlopy bezpłatne.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Efektywne zarządzanie urlopami</strong> jest kluczowe dla utrzymania ciągłości pracy, 
							zgodności z przepisami prawa pracy oraz zadowolenia pracowników.
						</p>
					</div>

					{/* Why important */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Dlaczego zarządzanie urlopami jest tak ważne?
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏢 Ciągłość pracy</h3>
								<p className="text-gray-700">
									Odpowiednie planowanie urlopów zapobiega sytuacjom, w których kluczowi pracownicy są nieobecni jednocześnie, 
									co mogłoby zakłócić działanie firmy.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">⚖️ Zgodność z prawem</h3>
								<p className="text-gray-700">
									Polskie prawo pracy jasno określa zasady udzielania urlopów. Niewłaściwe zarządzanie może skutkować 
									karami finansowymi i problemami prawnymi.
								</p>
							</div>
							<div className="bg-purple-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">😊 Zadowolenie pracowników</h3>
								<p className="text-gray-700">
									Pracownicy doceniają przejrzyste zasady dotyczące urlopów. Łatwy dostęp do informacji i prosty proces 
									składania wniosków zwiększa ich satysfakcję.
								</p>
							</div>
							<div className="bg-orange-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Kontrola kosztów</h3>
								<p className="text-gray-700">
									Efektywne zarządzanie urlopami pozwala lepiej kontrolować koszty pracy, planować zastępstwa 
									i unikać nieplanowanych nadgodzin.
								</p>
							</div>
						</div>
					</div>

					{/* Traditional methods problems */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Problemy z tradycyjnymi metodami zarządzania urlopami
						</h2>
						<div className="space-y-6">
							<div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Arkusze kalkulacyjne Excel</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Łatwo o błędy przy ręcznym wprowadzaniu danych</li>
									<li>• Brak aktualności - informacje szybko stają się nieaktualne</li>
									<li>• Trudności w dostępie dla pracowników</li>
									<li>• Brak kontroli wersji i backupów</li>
								</ul>
							</div>
							<div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Papierowe wnioski</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Czasochłonny proces składania i zatwierdzania</li>
									<li>• Ryzyko zgubienia dokumentów</li>
									<li>• Trudności w archiwizacji i wyszukiwaniu</li>
									<li>• Brak możliwości pracy zdalnej</li>
								</ul>
							</div>
							<div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Kalendarze ścienne</h3>
								<ul className="text-gray-700 space-y-2">
									<li>• Ograniczona dostępność - tylko w biurze</li>
									<li>• Brak możliwości automatycznych obliczeń</li>
									<li>• Trudności w zarządzaniu większymi zespołami</li>
									<li>• Brak integracji z innymi systemami</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Modern solutions */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Nowoczesne rozwiązania: aplikacje do zarządzania urlopami
						</h2>
						<div className="space-y-6">
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Automatyzacja procesów</h3>
								<p className="text-gray-700">
									Aplikacje do zarządzania urlopami automatyzują obliczanie przysługującego urlopu, składanie i zatwierdzanie wniosków, 
									a także aktualizowanie sald. To oszczędza czas zarówno pracownikom, jak i działowi HR.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Centralizacja danych</h3>
								<p className="text-gray-700">
									Wszystkie informacje o urlopach są przechowywane w jednym miejscu, dostępne dla uprawnionych osób 
									w dowolnym czasie i z dowolnego miejsca.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Przejrzystość i dostępność</h3>
								<p className="text-gray-700">
									Pracownicy mogą w łatwy sposób sprawdzić swoje saldo urlopowe, złożyć wniosek i śledzić jego status. 
									Menedżerowie mają pełny wgląd w harmonogramy nieobecności zespołu.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Zgodność z prawem</h3>
								<p className="text-gray-700">
									Dobre systemy są zgodne z obowiązującymi przepisami prawa pracy, co minimalizuje ryzyko błędów i kar.
								</p>
							</div>
						</div>
					</div>

					{/* Planopia section */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Planopia - najlepsza aplikacja do zarządzania urlopami
						</h2>
						<div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
							<h3 className="text-2xl font-bold text-gray-900 mb-4">Dlaczego Planopia?</h3>
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Pełna funkcjonalność</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• Automatyczne obliczanie urlopu</li>
										<li>• Łatwe składanie wniosków online</li>
										<li>• Proces zatwierdzania z powiadomieniami</li>
										<li>• Kalendarz nieobecności</li>
									</ul>
								</div>
								<div>
									<h4 className="text-lg font-semibold text-gray-900 mb-3">💰 Darmowa dla małych firm</h4>
									<ul className="text-gray-700 space-y-2">
										<li>• 30 dni za darmo, do 5 użytkowników (pełne funkcje)</li>
										<li>• Pełna funkcjonalność</li>
										<li>• Bez ukrytych kosztów</li>
										<li>• Wsparcie techniczne</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Types of leave */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Rodzaje urlopów obsługiwane przez Planopię
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏖️ Urlopy wypoczynkowe</h3>
								<p className="text-gray-700">
									Automatyczne obliczanie przysługującego urlopu na podstawie stażu pracy, 
									z możliwością przenoszenia niewykorzystanych dni na następny rok.
								</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Urlopy na żądanie</h3>
								<p className="text-gray-700">
									Szybkie składanie wniosków na urlopy na żądanie z automatycznym zatwierdzaniem 
									zgodnie z zasadami firmy.
								</p>
							</div>
							<div className="bg-purple-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">🏥 Urlopy chorobowe</h3>
								<p className="text-gray-700">
									Ewidencja zwolnień lekarskich z możliwością automatycznego rozliczania 
									i integracji z systemami ZUS.
								</p>
							</div>
							<div className="bg-orange-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">👶 Opieka nad dzieckiem</h3>
								<p className="text-gray-700">
									Obsługa urlopów związanych z opieką nad dzieckiem, w tym urlopy rodzicielskie, 
									opiekuńcze i wychowawcze.
								</p>
							</div>
						</div>
					</div>

					{/* FAQ */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Często zadawane pytania o zarządzanie urlopami
						</h2>
						<div className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Jak długo trwa wdrożenie systemu zarządzania urlopami?
								</h3>
								<p className="text-gray-700">
									Wdrożenie Planopii trwa zaledwie kilka minut. Możesz rozpocząć korzystanie z systemu 
									natychmiast po rejestracji zespołu i dodaniu pracowników.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy aplikacja do zarządzania urlopami jest bezpieczna?
								</h3>
								<p className="text-gray-700">
									Planopia oferuje najwyższe standardy bezpieczeństwa: szyfrowanie danych, bezpieczne serwery, 
									regularne kopie zapasowe i pełną zgodność z RODO.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy mogę eksportować dane o urlopach?
								</h3>
								<p className="text-gray-700">
									Tak! Planopia umożliwia eksport wszystkich danych o urlopach do formatów PDF i Excel. 
									Twoje dane zawsze pozostają Twoje i możesz je pobrać w każdej chwili.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Czy system obsługuje różne rodzaje urlopów?
								</h3>
								<p className="text-gray-700">
									Tak! Planopia obsługuje wszystkie rodzaje urlopów: wypoczynkowe, na żądanie, chorobowe, 
									opieka nad dzieckiem, bezpłatne i inne zgodnie z potrzebami Twojej firmy.
								</p>
							</div>
						</div>
					</div>

					{/* CTA */}
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
						<h2 className="text-3xl font-bold text-gray-900 mb-4 justify-center">
							Gotowy na efektywne zarządzanie urlopami?
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
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default BlogSix
