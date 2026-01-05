'use client'

import { useState } from 'react'
import Link from 'next/link'

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
						"description": "Oficjalny blog aplikacji Planopia – artykuły o ewidencji czasu pracy, zarządzaniu urlopami i organizacji pracy w firmie.",
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
						<Link href="/en/blog" className="flex items-center languagechoose">
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
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
							href="/#oaplikacji"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							O Aplikacji
						</Link>
						<Link
							href="/#cennik"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Cennik
						</Link>
						<Link
							href="/#kontakt"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4">
							Kontakt
						</Link>
						<Link
							href="/blog"
							className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition mb-4"
							onClick={toggleMenu}>
							Blog
						</Link>
						<Link
							href="https://app.planopia.pl/"
							onClick={toggleMenu}
							className="w-full text-center bg-transparent text-blue-600 font-semibold py-2 px-4 border border-blue-600 rounded mb-4 hover:bg-blue-50 hover:text-blue-700 transition"
						>
							Logowanie
						</Link>

						<Link
							href="https://app.planopia.pl/team-registration"
							onClick={toggleMenu}
							className="ctamenu w-full text-center bg-green-600 text-white font-semibold py-2 px-4 rounded mb-4 shadow hover:bg-green-700 transition"
						>
							Załóż darmowy zespół
						</Link>
						<Link href="/en/blog" className="flex items-center languagechoose" style={{ marginTop: '15px' }}>
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</div>
				)}
			</header>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="planopia-welcome">
				<div className="max-w-7xl mx-auto text-left">
					<div className="grid gap-10 items-center">
						<div className="ordering">
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 text-center mt-4">Blog</h1>
						</div>
						
					</div>
				</div>
			</section>

			<section className="px-4 py-16 bg-white">
				<div className="max-w-7xl mx-auto">
					<div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						

						{/* Karta wpisu - Dni wolne 2026 */}
						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/planvacationblog.webp" alt="Kalendarz dni wolnych 2026" className="rounded-md mb-4 h-48 object-cover" />
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
							<img src="/img/worktimeblog.webp" alt="Kompleksowa aplikacja do zarządzania firmą" className="rounded-md mb-4 h-48 object-cover" />
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
							<img src="/img/planvacationblog.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
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
							<img src="/img/worktimeblog.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
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

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/worktimeblog.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Darmowa aplikacja do ewidencji czasu pracy i urlopów
							</h3>
							<p className="text-gray-600 flex-1">
							Odkryj Planopię - kompletną, darmową aplikację do ewidencji czasu pracy i zarządzania urlopami. 
								Pełna funkcjonalność dla zespołów do 6 osób bez żadnych opłat.
							</p>
							<Link
								href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy"
								className="mt-4 inline-block bg-white-600 text-dark font-semibold py-2 px-4 rounded transition">
								Czytaj więcej
							</Link>
						</div>

						<div className="bg-gray-50 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
							<img src="/img/worktimeblog.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
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
							<img src="/img/planvacationblog.webp" alt="..." className="rounded-md mb-4 h-48 object-cover" />
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

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default Blog
