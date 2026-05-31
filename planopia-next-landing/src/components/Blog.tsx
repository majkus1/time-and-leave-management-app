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
import { planOfferingCopy } from '@/data/planOfferingCopy'
import BlogTopicsNav from './BlogTopicsNav'
import { BLOG_PILLAR_PL } from '@/data/blogInternalLinks'

function Blog() {
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
						"@type": "Blog",
						"name": "Blog Planopii",
						"url": "https://planopia.pl/blog",
						"description": `Oficjalny blog Planopii — ewidencja czasu pracy online, urlopy, HR, produktywność.${planOfferingCopy.pl.blogJsonLdExtra}`,
						"author": {
							"@type": "Person",
							"name": "Michał Lipka"
						}
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
							className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
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
						<Link href="/en/blog" className="flex items-center languagechoose">
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
					href: '/en/blog',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 pt-6 pb-3 md:py-10 bg-gradient-to-r from-blue-50 to-white landing-hero-below-fixed-header" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-0 md:mb-6 blogh1 text-center mt-2 md:mt-4">Blog</h1>
						</div>
						
					</div>
				</div>
			</section>

			<section className="px-4 pt-5 pb-12 md:py-16 bg-white">
				<div className="max-w-7xl mx-auto">
					<BlogTopicsNav />

					<div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						

						{/* Karta — Asystent AI */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-indigo-100/90">
							<img
								src="/img/aibloga.webp"
								alt="Asystent AI w Planopii — ewidencja, urlopy, zadania i grafik"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Asystent AI w Planopii: ewidencja, urlopy, zadania i grafik w jednym systemie
							</h3>
							<p className="text-gray-600 flex-1">
								Jak połączyć ewidencję czasu pracy, urlopy, tablice zadań i grafik z inteligentnym podsumowaniem — automatyzacja pracy zespołu i procesów HR bez pięciu osobnych narzędzi.
							</p>
							<Link
								href="/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta — ewidencja na budowie */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-amber-100/80">
							<img
								src="/img/budowa1.webp"
								alt="Ewidencja czasu pracy na budowie — firma budowlana"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Jak prowadzić ewidencję czasu pracy na budowie (prosto i bez Excela)
							</h3>
							<p className="text-gray-600 flex-1">
								Poradnik dla firm budowlanych: jeden system zamiast kartek i arkuszy, nadgodziny, grafiki brygad — oraz tablice zadań i czaty, żeby zespół miał narzędzie na co dzień, nie tylko przy urlopach.
							</p>
							<Link
								href="/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta wpisu — instrukcja wideo */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-blue-100/80">
							<div className="relative rounded-md mb-4 h-48 overflow-hidden bg-slate-900">
								<img
									src="/img/video.webp"
									alt="Instrukcja wideo Planopia — poradniki z aplikacji"
									className="h-full w-full object-cover opacity-90"
								/>
								<span className="boxvideo absolute bottom-3 left-3 inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
									Wideo
								</span>
							</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Instrukcja wideo — jak korzystać z Planopii
							</h3>
							<p className="text-gray-600 flex-1">
								Krótkie nagrania z aplikacji: m.in. jak ręcznie dodać godziny czasu pracy w ewidencji. Oglądaj na telefonie lub komputerze — kolejne filmy będziemy dodawać na bieżąco.
							</p>
							<Link
								href="/blog/instrukcja-wideo-planopia"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta wpisu - Jak zainstalować Planopię jako PWA */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/pwas.webp" alt="Instalacja Planopii jako aplikacji PWA na telefonie i komputerze" className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Jak zainstalować Planopię jako aplikację PWA? Instrukcja krok po kroku
							</h3>
							<p className="text-gray-600 flex-1">
							Dowiedz się, jak dodać Planopię jako aplikację PWA na iPhonie, iPadzie, telefonie z Androidem oraz w przeglądarce na komputerze (np. Chrome). Krótka instrukcja instalacji aplikacji do ewidencji czasu pracy i zarządzania urlopami na ekranie głównym, w menu aplikacji lub na pulpicie.
							</p>
							<Link
								href="/blog/jak-zainstalowac-planopie-jako-pwa"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta — roczny plan urlopów Excel / PDF / aplikacja */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-emerald-100/90">
							<img
								src="/img/roczny-plan.webp"
								alt="Roczny plan urlopów — kalendarz i wnioski w Planopii"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Roczny plan urlopów: Excel, PDF i aplikacja — co wybrać w 2026?
							</h3>
							<p className="text-gray-600 flex-1">
								Arkusz i eksport do PDF na start; checklista programu do wniosków urlopowych; nadgodziny i ewidencja — jak przejść z Excela do systemu z akceptacjami, bez chaosu wersji plików.
							</p>
							<Link
								href="/blog/roczny-plan-urlopow-excel-pdf-aplikacja"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta — program do urlopów dla małej firmy */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-1 ring-emerald-100/90">
							<img
								src="/img/plans-urlopnew.webp"
								alt="Program do urlopów dla małej firmy — Planopia"
								className="rounded-md mb-4 h-48 object-cover"
							/>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								Program do urlopów dla małej firmy — jak wybrać (2026)
							</h3>
							<p className="text-gray-600 flex-1">
								Kryteria wyboru, realnie przydatne funkcje, koszt i odpowiedź na pytanie, czy istnieje darmowy program do urlopów. Praktyczny przewodnik dla małych zespołów.
							</p>
							<Link
								href="/blog/program-do-urlopow-dla-malej-firmy"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta wpisu - Dni wolne 2026 */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/dni wolnes.webp" alt="Kalendarz dni wolnych 2026" className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Dni wolne 2026 – kompletny kalendarz świąt w Polsce
							</h3>
							<p className="text-gray-600 flex-1">
							Sprawdź wszystkie dni wolne 2026 w Polsce. Kompletny kalendarz świąt ustawowych z informacją o długich weekendach i poradami, jak efektywnie zaplanować urlopy w 2026 roku. Dowiedz się, które dni są ustawowo wolne od pracy.
							</p>
							<Link
								href="/blog/dni-wolne-2026"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta wpisu - Kompleksowa aplikacja */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/kompleksowos.webp" alt="Kompleksowa aplikacja do zarządzania firmą" className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Kompleksowa aplikacja do zarządzania firmą – wszystko w jednym miejscu
							</h3>
							<p className="text-gray-600 flex-1">
							Planopia to nie tylko aplikacja do ewidencji czasu pracy i urlopów. To kompleksowe narzędzie łączące ewidencję czasu, urlopy, grafiki pracy, czaty, tablice zadań i elastyczną konfigurację ról. Wszystko w jednym miejscu.
							</p>
							<Link
								href="/blog/kompleksowa-aplikacja-do-zarzadzania-firma"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta wpisu 3 */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/planowanie urlopows.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Planowanie urlopów pracowników – najlepsze narzędzia i praktyki
							</h3>
							<p className="text-gray-600 flex-1">
							Planowanie urlopów to jedno z najczęstszych wyzwań w działach HR i u menedżerów zespołów. Tradycyjne metody – papierowe wnioski czy Excel – prowadzą do chaosu i błędów. Dowiedz się, jak kalendarz urlopowy online i aplikacje takie jak Planopia pomagają w prostym i skutecznym zarządzaniu nieobecnościami.
							</p>
							<Link
								href="/blog/planowanie-urlopow"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						{/* Karta wpisu 4 */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/ewidencjas.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm
							</h3>
							<p className="text-gray-600 flex-1">
							Prowadzenie dokładnej ewidencji czasu pracy to obowiązek każdej firmy. Tradycyjne metody, takie jak papierowe listy obecności czy Excel, często są nieefektywne i podatne na błędy. Dlatego coraz więcej przedsiębiorstw wybiera programy i aplikacje online, które automatyzują i porządkują ten proces.
							</p>
							<Link
								href="/blog/ewidencja-czasu-pracy-online"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						<article className="blog-pillar-guide-card bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col ring-2 ring-emerald-300/90">
							<span className="blog-pillar-guide-badge inline-flex w-fit mb-2 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold tracking-wide !text-white">
								Główny przewodnik
							</span>
							<img src="/img/ewidencjas.webp" alt="Darmowa aplikacja do ewidencji czasu pracy Planopia" className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Darmowa aplikacja do ewidencji czasu pracy i urlopów
							</h3>
							<p className="text-gray-600 flex-1">
							30 dni pełnej aplikacji za darmo (do 5 osób); potem bezpłatna ewidencja czasu pracy do 5 aktywnych kont lub pakiety płatne z urlopami, grafikami, czatem i AI.
							</p>
							<Link
								href={BLOG_PILLAR_PL.href}
								className="blog-pillar-guide-cta white-text-btn mt-4 inline-block w-full sm:w-auto text-center bg-emerald-600 font-semibold py-2.5 px-5 rounded-lg shadow-sm transition hover:bg-emerald-700 !text-white hover:!text-white no-underline">
								Czytaj przewodnik
							</Link>
						</article>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/ewidencjas.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Elektroniczna ewidencja czasu pracy - kompletny przewodnik
							</h3>
							<p className="text-gray-600 flex-1">
							Dowiedz się wszystkiego o elektronicznej ewidencji czasu pracy. Kompletny przewodnik po wyborze najlepszego programu do ewidencji czasu pracy dla Twojej firmy.
							</p>
							<Link
								href="/blog/elektroniczna-ewidencja-czasu-pracy"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/planowanie urlopows.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Zarządzanie urlopami w firmie - kompletny przewodnik
							</h3>
							<p className="text-gray-600 flex-1">
							Dowiedz się, jak efektywnie zarządzać urlopami w swojej firmie, minimalizując błędy i zwiększając satysfakcję pracowników.
							</p>
							<Link
								href="/blog/zarzadzanie-urlopami"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>
					</div>
				</div>
			</section>

		</>
	)
}

export default Blog
