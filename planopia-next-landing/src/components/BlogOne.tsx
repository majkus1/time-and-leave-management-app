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
import BlogHeroDualCtaCards from './BlogHeroDualCtaCards'
import BlogRelatedLinks from './BlogRelatedLinks'

function BlogOne() {
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
						"headline": "Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm",
						"description": "Ewidencja czasu pracy online — program i aplikacja z rejestracją godzin i raportami PDF/XLSX. 30 dni pełnej aplikacji za darmo (do 5 osób), potem darmowy plan ewidencji do 5 aktywnych kont lub pakiety płatne z urlopami i AI.",
						"image": "https://planopia.pl/img/desktopnews.webp",
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
						"url": "https://planopia.pl/blog/ewidencja-czasu-pracy-online",
						"datePublished": "2025-08-25",
						"dateModified": "2026-05-31"
					})
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'FAQPage',
						mainEntity: [
							{
								'@type': 'Question',
								name: 'Czym jest ewidencja czasu pracy online?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'To prowadzenie rejestracji godzin pracy i nadgodzin w aplikacji dostępnej z przeglądarki lub telefonu (np. jako PWA), zamiast wyłącznie w papierze lub rozproszonych plikach Excel.',
								},
							},
							{
								'@type': 'Question',
								name: 'Czy program do ewidencji czasu pracy online zastępuje Excel?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Tak — typowy program do ewidencji czasu pracy przenosi wpisy, raporty i eksport do PDF/XLSX do jednego systemu; Excel nadal możesz użyć jako format eksportu danych z aplikacji.',
								},
							},
							{
								'@type': 'Question',
								name: 'Czy Planopia oferuje darmową ewidencję czasu pracy?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Po 30 dniach pełnej aplikacji (do 5 użytkowników) możesz pozostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wykupić pakiet płatny z urlopami i pozostałymi modułami.',
								},
							},
						],
					}),
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
						<Link href="/en/blog/time-tracking-online" className="flex items-center languagechoose">
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
					href: '/en/blog/time-tracking-online',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version'
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero">
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="grid xl:grid-cols-2 gap-10 items-center">
						<div>
							<h1 className="text-4xl font-bold mb-6">
								Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm
							</h1>
							<p className="text-gray-700 text-lg">
								Prowadzenie dokładnej <strong>ewidencji czasu pracy</strong> to obowiązek każdej firmy. Tradycyjne metody, 
								takie jak papierowe listy obecności czy Excel, często są nieefektywne i podatne na błędy. 
								Dlatego coraz więcej przedsiębiorstw wybiera <strong>programy i aplikacje online</strong>, 
								które automatyzują i porządkują ten proces.
							</p>

							<BlogRelatedLinks
								slug="ewidencja-czasu-pracy-online"
								position="top"
								className="mt-6 md:mt-8"
							/>

							<BlogHeroDualCtaCards
								locale="pl"
								trial={
									<>
										<span className="font-semibold text-emerald-900">Darmowa aplikacja do ewidencji czasu pracy</span>
										{' '}
										— 30 dni pełnej aplikacji; potem bezpłatna ewidencja do 5 aktywnych kont
									</>
								}
								enterprise={
									<>
										<span className="font-semibold text-slate-900">Dla większych firm:</span>{' '}
										nielimitowana liczba użytkowników, większe możliwości i elastyczność
									</>
								}
							/>

							<div className="mt-5">
								<Link
									href="/program-do-ewidencji-czasu-pracy"
									className="inline-flex items-center text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline"
								>
									Zobacz program do ewidencji czasu pracy →
								</Link>
							</div>
						</div>

						<img
							src="/img/desktopnews.webp"
							alt="Ewidencja czasu pracy online w Planopii — widok na komputerze"
							className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
						/>
						<img
							src="/img/mobilenews.webp"
							alt="Ewidencja czasu pracy online w Planopii — widok na telefonie"
							className="rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile"
						/>
					</div>
				</div>
			</section>

			<article className="max-w-6xl mx-auto px-6 py-12">
				<h2 className="text-2xl font-semibold mb-3">Dlaczego ewidencja czasu pracy jest tak ważna?</h2>
				<p className="mb-4 text-gray-700">
					Ewidencja czasu pracy to nie tylko obowiązek wynikający z Kodeksu pracy, ale przede wszystkim 
					narzędzie do lepszego zarządzania firmą. Pozwala na kontrolę godzin pracy, nadgodzin, urlopów 
					i nieobecności, a także ułatwia rozliczenia z pracownikami oraz ZUS.
				</p>

				<h2 className="text-2xl font-semibold mb-3">Najczęstsze problemy z tradycyjną ewidencją</h2>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Rozproszone dokumenty – papierowe listy obecności łatwo zgubić.</li>
					<li>Błędy w Excelu – pomyłki w formułach i ręcznych wpisach.</li>
					<li>Brak dostępu online – pracownicy i menedżerowie nie widzą aktualnych danych.</li>
					<li>Trudności w raportowaniu – przygotowanie zestawień zajmuje dużo czasu.</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Excel a ewidencja czasu pracy online</h2>
				<p className="mb-4 text-gray-700">
					Wyszukiwania typu „ewidencja czasu pracy excel” często oznaczają próbę rozwiązania obowiązku kadrowego arkuszem. Excel na start może wystarczyć, lecz przy większej liczbie osób rośnie ryzyko błędów i braku jednej wspólnej wersji.{' '}
					<strong>Ewidencja czasu pracy online</strong> w aplikacji webowej zbiera wpisy w jednym miejscu, ułatwia rejestrację z telefonu i przygotowanie zestawień do PDF/XLSX. Szerszy opis elektronicznej formy:{' '}
					<Link href="/blog/elektroniczna-ewidencja-czasu-pracy" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
						elektroniczna ewidencja czasu pracy — przewodnik
					</Link>
					.
				</p>

				<h2 className="text-2xl font-semibold mb-3">Rejestracja czasu pracy online — system i aplikacja</h2>
				<p className="mb-4 text-gray-700">
					<strong>Rejestracja czasu pracy online</strong> to po prostu wpisywanie godzin (lub start/stop) w systemie dostępnym z sieci — bez wysyłania skanów list do biura. W Planopii ten sam zespół może później rozszerzyć konto o moduł urlopów i inne funkcje HR w ramach płatnych pakietów. Porównanie modelu cenowego:{' '}
					<Link href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
						darmowa aplikacja do ewidencji czasu pracy i okres próbny
					</Link>
					.
				</p>

				<h2 className="text-2xl font-semibold mb-3">Program do ewidencji czasu pracy – co powinien mieć?</h2>
				<p className="mb-4 text-gray-700">
					Nowoczesne aplikacje do ewidencji czasu pracy powinny być dostępne z dowolnego miejsca, 
					proste w obsłudze i bezpieczne. Jeśli szukasz gotowego rozwiązania, zobacz nasz{' '}
					<Link href="/program-do-ewidencji-czasu-pracy" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
						program do ewidencji czasu pracy
					</Link>
					. Oto kluczowe funkcje:
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Intuicyjny kalendarz pracy z możliwością wpisu godzin i nadgodzin.</li>
					<li>Automatyczne podsumowania i raporty (np. w PDF/XLSX).</li>
					<li>Obsługa urlopów i nieobecności z powiadomieniami e-mail.</li>
					<li>Dostępność na urządzeniach mobilnych (PWA i aplikacja webowa).</li>
					<li>Bezpieczne logowanie i ochrona danych pracowników.</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Planopia – aplikacja do ewidencji czasu pracy</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> to polska aplikacja webowa, która automatyzuje procesy związane 
					z czasem pracy i urlopami. Dzięki niej Twoja firma zyskuje:
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Pełną kontrolę nad ewidencją godzin pracy i nadgodzin.</li>
					<li>Szybkie zgłaszanie i akceptowanie urlopów.</li>
					<li>Raporty i kalendarze pracy dostępne online i w formie PDF.</li>
					<li>30 dni pełnej aplikacji dla do 5 użytkowników; potem bezpłatny plan ewidencji (do 5 aktywnych kont) lub pakiety płatne.</li>
					<li>Możliwość rozbudowy i personalizacji dla większych firm.</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Podsumowanie</h2>
				<p className="mb-4 text-gray-700">
					Ewidencja czasu pracy nie musi być skomplikowana. Dzięki aplikacjom takim jak 
					<strong> Planopia</strong>, Twoja firma oszczędza czas, unika błędów i działa zgodnie z przepisami.  
					Niezależnie, czy masz <strong>mały zespół do 5 osób</strong>, czy dużą organizację – 
					z Planopią wszystko masz pod kontrolą.
				</p>

				<section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 md:p-8" aria-labelledby="faq-ewidencja-online">
					<h2 id="faq-ewidencja-online" className="text-2xl font-semibold mb-4">
						Najczęstsze pytania: ewidencja czasu pracy online
					</h2>
					<dl className="space-y-5 text-gray-700">
						<div>
							<dt className="font-semibold text-gray-900">Czym jest ewidencja czasu pracy online?</dt>
							<dd className="mt-1">
								To prowadzenie rejestracji godzin pracy i nadgodzin w aplikacji dostępnej z przeglądarki lub telefonu (np. jako PWA), zamiast wyłącznie w papierze lub rozproszonych plikach Excel.
							</dd>
						</div>
						<div>
							<dt className="font-semibold text-gray-900">Czy program do ewidencji czasu pracy online zastępuje Excel?</dt>
							<dd className="mt-1">
								Tak — typowy program do ewidencji przenosi wpisy i raporty do jednego systemu; plik Excel możesz nadal pobrać jako eksport danych, gdy potrzebujesz go do archiwum lub dalszej obróbki.
							</dd>
						</div>
						<div>
							<dt className="font-semibold text-gray-900">Czy Planopia oferuje darmową ewidencję czasu pracy?</dt>
							<dd className="mt-1">
								Po 30 dniach pełnej aplikacji (do 5 użytkowników) możesz pozostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wykupić pakiet płatny z urlopami i pozostałymi modułami.
							</dd>
						</div>
					</dl>
				</section>

				<aside
					className="blog-end-cta mt-10 md:mt-12 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-sky-50/40 p-6 md:p-8 shadow-sm ring-1 ring-emerald-100/60"
					aria-label="Wypróbuj Planopię"
				>
					<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
						<div className="min-w-0">
							<p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700/90 mb-2">
								Zacznij za darmo
							</p>
							<h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight m-0">
								Wypróbuj Planopię
							</h3>
							<p className="mt-2 text-sm text-gray-600 m-0 max-w-xl leading-relaxed">
								Załóż darmowy zespół i zacznij ewidencję czasu pracy online.
							</p>
						</div>
						<div className="shrink-0 w-full sm:w-auto">
							<Link
								href="https://app.planopia.pl/team-registration"
								className="blog-inline-cta-btn inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
							>
								Załóż darmowy zespół
							</Link>
						</div>
					</div>
				</aside>

				<BlogRelatedLinks slug="ewidencja-czasu-pracy-online" className="mt-10" />
			</article>

			{/* FOOTER */}
		</>
	)
}

export default BlogOne
