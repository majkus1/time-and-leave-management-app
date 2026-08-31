'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'

function InstallationSteps({ steps }: { steps: ReactNode[] }) {
	return (
		<ol className="space-y-4">
			{steps.map((step, index) => (
				<li key={index} className="flex items-start gap-3 text-gray-700">
					<span
						className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
						aria-hidden="true"
					>
						{index + 1}
					</span>
					<span className="pt-0.5 leading-relaxed">{step}</span>
				</li>
			))}
		</ol>
	)
}

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
						"description": "Instrukcja PWA Planopii: iPhone, Android, desktop. Po instalacji masz szybki dostęp do ewidencji czasu pracy; 30 dni pełnej aplikacji, potem darmowy plan ewidencji do 5 kont lub pakiety z urlopami i AI.",
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
								"url": "https://planopia.pl/img/new-logoplanopia.webp"
							}
						},
						"url": "https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa",
						"datePublished": "2025-01-15",
						"dateModified": "2025-01-15"
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
						<LandingSolutionsDropdown locale="pl" />
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
						<Link href="/en/blog/how-to-install-planopia-as-pwa" className="flex items-center languagechoose">
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</nav>

					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>
			<div className="header-fixed-spacer" aria-hidden="true" />

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
					href: '/en/blog/how-to-install-planopia-as-pwa',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero">
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-4xl font-bold mb-6">
							Jak zainstalować Planopię jako aplikację PWA? Instrukcja instalacji
						</h1>
						<p className="text-gray-700 text-lg max-w-3xl">
							Wybierz swoje urządzenie i przejdź od razu do krótkiej instrukcji. Instalacja zajmuje zwykle mniej niż minutę.
						</p>
						<nav className="grid gap-3 mt-7 sm:grid-cols-3" aria-label="Wybierz urządzenie">
							<a href="#instalacja-ios" className="group rounded-lg border border-blue-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
								<span className="block text-sm font-semibold text-blue-700">iPhone i iPad</span>
								<span className="mt-1 block text-sm text-gray-600">Instrukcja dla Safari</span>
							</a>
							<a href="#instalacja-android" className="group rounded-lg border border-blue-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
								<span className="block text-sm font-semibold text-blue-700">Android</span>
								<span className="mt-1 block text-sm text-gray-600">Instrukcja dla Chrome</span>
							</a>
							<a href="#instalacja-komputer" className="group rounded-lg border border-blue-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
								<span className="block text-sm font-semibold text-blue-700">Komputer</span>
								<span className="mt-1 block text-sm text-gray-600">Chrome, Edge lub Opera</span>
							</a>
						</nav>
					</div>
				</div>
			</section>

			<article className="max-w-4xl mx-auto px-6 py-10">
				<section aria-labelledby="installation-heading">
					<div className="mb-7">
						<p className="mb-2 text-sm font-semibold uppercase text-blue-700">Instrukcja krok po kroku</p>
						<h2 id="installation-heading" className="text-2xl font-semibold mb-3">Zainstaluj Planopię na swoim urządzeniu</h2>
						<p className="text-gray-700">Najpierw otwórz stronę logowania, a następnie wykonaj kroki odpowiednie dla swojego urządzenia.</p>
					</div>

					<div className="space-y-5 mb-12">
						<section id="instalacja-ios" className="scroll-mt-28 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
							<div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
								<p className="text-sm font-semibold text-blue-700">Safari</p>
								<h3 className="mt-1 text-xl font-semibold text-gray-900">iPhone i iPad</h3>
							</div>
							<div className="p-6">
								<InstallationSteps steps={[
									<>Otwórz Safari i przejdź do <a href="https://app.planopia.pl/" className="font-semibold text-blue-700 underline underline-offset-2">app.planopia.pl</a>.</>,
									<>Naciśnij przycisk <strong>Udostępnij</strong> (kwadrat ze strzałką skierowaną w górę).</>,
									<>Przewiń listę i wybierz <strong>Dodaj do ekranu początkowego</strong>.</>,
									<>Sprawdź nazwę i naciśnij <strong>Dodaj</strong>. Ikona Planopii pojawi się na ekranie początkowym.</>,
								]} />
							</div>
						</section>

						<section id="instalacja-android" className="scroll-mt-28 overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm">
							<div className="border-b border-green-100 bg-green-50 px-6 py-4">
								<p className="text-sm font-semibold text-green-700">Google Chrome</p>
								<h3 className="mt-1 text-xl font-semibold text-gray-900">Telefon lub tablet z Androidem</h3>
							</div>
							<div className="p-6">
								<InstallationSteps steps={[
									<>Otwórz Chrome i przejdź do <a href="https://app.planopia.pl/" className="font-semibold text-blue-700 underline underline-offset-2">app.planopia.pl</a>.</>,
									<>Naciśnij menu z trzema kropkami w prawym górnym rogu.</>,
									<>Wybierz <strong>Zainstaluj aplikację</strong> lub <strong>Dodaj do ekranu głównego</strong>.</>,
									<>Potwierdź instalację. Ikona Planopii pojawi się na ekranie głównym lub liście aplikacji.</>,
								]} />
							</div>
						</section>

						<section id="instalacja-komputer" className="scroll-mt-28 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
							<div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
								<p className="text-sm font-semibold text-gray-600">Chrome, Edge lub Opera</p>
								<h3 className="mt-1 text-xl font-semibold text-gray-900">Komputer z Windows lub macOS</h3>
							</div>
							<div className="p-6">
								<InstallationSteps steps={[
									<>Otwórz obsługiwaną przeglądarkę i przejdź do <a href="https://app.planopia.pl/" className="font-semibold text-blue-700 underline underline-offset-2">app.planopia.pl</a>.</>,
									<>Kliknij ikonę instalacji po prawej stronie paska adresu. Jeżeli jej nie widzisz, otwórz menu przeglądarki i wybierz opcję instalacji aplikacji.</>,
									<>Wybierz <strong>Zainstaluj</strong> i potwierdź.</>,
									<>Uruchamiaj Planopię z menu Start w Windows lub z Launchpada w macOS. Możesz też przypiąć ją do paska zadań.</>,
								]} />
							</div>
						</section>
					</div>
				</section>

				<section className="border-t border-gray-200 pt-10">
					<h2 className="text-2xl font-semibold mb-4">Dlaczego warto zainstalować Planopię jako PWA?</h2>
					<p className="mb-4 text-gray-700">
						Planopia to Progressive Web App, dlatego możesz korzystać z niej podobnie jak ze zwykłej aplikacji, bez pobierania jej ze sklepu.
					</p>
					<ul className="list-disc pl-6 mb-8 text-gray-700 space-y-2">
						<li><strong>Szybki dostęp</strong> – aplikacja jest zawsze pod ręką na ekranie głównym</li>
						<li><strong>Działa jak natywna aplikacja</strong> – pełnoekranowy interfejs bez pasków przeglądarki</li>
						<li><strong>Automatyczne aktualizacje</strong> – zawsze masz najnowszą wersję bez ręcznego aktualizowania</li>
						<li><strong>Oszczędność miejsca</strong> – nie zajmuje dużo miejsca w pamięci telefonu</li>
						<li><strong>Bezpieczeństwo</strong> – połączenie z aplikacją jest szyfrowane</li>
					</ul>
				</section>

				<h2 className="text-2xl font-semibold mb-4">Gotowe! Jak korzystać z Planopii jako PWA?</h2>
				<p className="mb-4 text-gray-700">
					Po instalacji znajdziesz ikonę Planopii na ekranie głównym swojego telefonu (lub w menu Start/Launchpad na desktopie). 
					Kliknij na nią, aby otworzyć aplikację – będzie działać jak natywna aplikacja!
				</p>
				<ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
					<li><strong>Pełnoekranowy interfejs</strong> – bez pasków przeglądarki</li>
					<li><strong>Szybkie ładowanie</strong> – aplikacja ładuje się szybciej niż w przeglądarce</li>
					<li><strong>Funkcje zależnie od planu</strong> – w trialu i pakietach płatnych pełny zestaw; po próbie bez pakietu skupiamy się na ewidencji czasu pracy</li>
					<li><strong>Automatyczne aktualizacje</strong> – zawsze masz najnowszą wersję</li>
				</ul>


				{/* CTA na końcu */}
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8 text-center max-w-3xl mx-auto">
					<h3 className="text-xl font-semibold mb-3 text-gray-800 justify-center">Zacznij korzystać z Planopii już dziś!</h3>
					<p className="mb-4 text-gray-700">
						Planopia to aplikacja do ewidencji czasu pracy i — w trialu oraz pakietach płatnych — urlopów, grafików i zespołu. 
						30 dni pełnej aplikacji; potem darmowa ewidencja do 5 aktywnych kont lub pakiet płatny.
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

				<BlogRelatedLinks slug="jak-zainstalowac-planopie-jako-pwa" className="mt-10 max-w-3xl mx-auto" />
				<BlogArticleCredibility
					author="Michał Lipka"
					authorHref="/o-autorze"
					updatedOn={{ iso: '2025-01-15', label: '15 stycznia 2025 r.' }}
				/>
			</article>

			{/* FOOTER */}
		</>
	)
}

export default BlogPWA
