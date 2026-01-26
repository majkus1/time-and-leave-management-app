'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'

function BlogPWA() {
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
						"@type": "BlogPosting",
						"headline": "Jak zainstalować Planopię jako aplikację PWA? Instrukcja instalacji",
						"description": "Dowiedz się, jak zainstalować Planopię jako aplikację PWA na urządzeniu mobilnym. Prosta instrukcja instalacji aplikacji do ewidencji czasu pracy i zarządzania urlopami bezpośrednio na ekranie głównym telefonu.",
						"image": "https://planopia.pl/img/pwa1.png",
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Planopia",
							"logo": {
								"@type": "ImageObject",
								"url": "https://planopia.pl/img/planopiaheader.webp"
							}
						},
						"url": "https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa",
						"datePublished": "2025-01-15"
					})
				}}
			/>

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
						<Link href="/en/blog/how-to-install-planopia-as-pwa" className="flex items-center languagechoose">
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
					href: '/en/blog/how-to-install-planopia-as-pwa',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero" style={{ marginTop: '70px' }}>
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-4xl font-bold mb-6">
							Jak zainstalować Planopię jako aplikację PWA? Instrukcja instalacji
						</h1>
						<p className="text-gray-700 text-lg">
							Planopia to <strong>Progressive Web App (PWA)</strong>, co oznacza, że możesz zainstalować ją bezpośrednio na ekranie głównym swojego telefonu. 
							Dzięki temu będziesz mieć szybki dostęp do aplikacji do ewidencji czasu pracy i zarządzania urlopami, 
							bez konieczności otwierania przeglądarki za każdym razem.
						</p>
					</div>
				</div>
			</section>

			<article className="max-w-4xl mx-auto px-6 py-12">
				<h2 className="text-2xl font-semibold mb-4">Dlaczego warto zainstalować Planopię jako PWA?</h2>
				<p className="mb-4 text-gray-700">
					Instalacja Planopii jako aplikacji PWA na urządzeniu mobilnym przynosi wiele korzyści:
				</p>
				<ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
					<li><strong>Szybki dostęp</strong> – aplikacja jest zawsze pod ręką na ekranie głównym</li>
					<li><strong>Działa jak natywna aplikacja</strong> – pełnoekranowy interfejs bez pasków przeglądarki</li>
					<li><strong>Automatyczne aktualizacje</strong> – zawsze masz najnowszą wersję bez ręcznego aktualizowania</li>
					<li><strong>Działa offline</strong> – podstawowe funkcje dostępne nawet bez połączenia z internetem</li>
					<li><strong>Oszczędność miejsca</strong> – nie zajmuje dużo miejsca w pamięci telefonu</li>
					<li><strong>Bezpieczeństwo</strong> – wszystkie dane są szyfrowane i bezpieczne</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-4">Jak zainstalować Planopię jako PWA?</h2>
				<p className="mb-6 text-gray-700">
					Instalacja Planopii jako aplikacji PWA jest bardzo prosta i zajmuje zaledwie kilka sekund. 
					Proces różni się nieznacznie w zależności od używanego urządzenia:
				</p>

				<div className="space-y-6 mb-8">
					<div className="bg-gray-50 rounded-xl p-6">
						<h3 className="text-xl font-semibold mb-3 text-blue-600">Na urządzeniach z iOS (iPhone, iPad)</h3>
						<ol className="list-decimal pl-6 space-y-2 text-gray-700">
							<li>Otwórz przeglądarkę Safari i przejdź do strony logowania Planopii: <strong>app.planopia.pl</strong></li>
							<li>Kliknij na przycisk menu (trzy kropki) w prawym dolnym rogu ekranu</li>
							<li>Wybierz opcję <strong>"Udostępnij"</strong></li>
							<li>Przewiń w dół i wybierz <strong>"Dodaj do ekranu głównego"</strong></li>
							<li>Potwierdź instalację, klikając <strong>"Dodaj"</strong></li>
						</ol>
					</div>

					<div className="bg-gray-50 rounded-xl p-6">
						<h3 className="text-xl font-semibold mb-3 text-blue-600">Na urządzeniach z Androidem</h3>
						<ol className="list-decimal pl-6 space-y-2 text-gray-700">
							<li>Otwórz przeglądarkę Chrome i przejdź do strony logowania Planopii: <strong>app.planopia.pl</strong></li>
							<li>Kliknij na menu przeglądarki (trzy kropki) w prawym górnym rogu</li>
							<li>Wybierz opcję <strong>"Zainstaluj aplikację"</strong> lub <strong>"Dodaj do ekranu głównego"</strong></li>
							<li>Potwierdź instalację w oknie dialogowym</li>
						</ol>
					</div>
				</div>

				<h2 className="text-2xl font-semibold mb-4">Gotowe! Jak korzystać z Planopii jako PWA?</h2>
				<p className="mb-4 text-gray-700">
					Po instalacji znajdziesz ikonę Planopii na ekranie głównym swojego telefonu. 
					Kliknij na nią, aby otworzyć aplikację – będzie działać jak natywna aplikacja mobilna!
				</p>
				<ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
					<li><strong>Pełnoekranowy interfejs</strong> – bez pasków przeglądarki</li>
					<li><strong>Szybkie ładowanie</strong> – aplikacja ładuje się szybciej niż w przeglądarce</li>
					<li><strong>Wszystkie funkcje dostępne</strong> – ewidencja czasu pracy, urlopy, grafiki, czat i wiele więcej</li>
					<li><strong>Automatyczne aktualizacje</strong> – zawsze masz najnowszą wersję</li>
				</ul>


				{/* CTA na końcu */}
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8 text-center max-w-3xl mx-auto">
					<h3 className="text-xl font-semibold mb-3 text-gray-800 justify-center">Zacznij korzystać z Planopii już dziś!</h3>
					<p className="mb-4 text-gray-700">
						Planopia to kompleksowa aplikacja do zarządzania czasem pracy, urlopami i zespołem. 
						Darmowa wersja dla zespołów do 6 użytkowników!
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Link
							href="https://app.planopia.pl/team-registration"
							className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition whitespace-nowrap"
							style={{ color: 'white' }}
						>
							Załóż darmowy zespół
						</Link>
						<Link
							href="/#cennik"
							className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition whitespace-nowrap"
							style={{ color: 'white' }}
						>
							Zobacz cennik
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

export default BlogPWA
