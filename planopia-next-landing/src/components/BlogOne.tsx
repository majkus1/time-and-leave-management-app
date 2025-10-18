'use client'

import { useState } from 'react'
import Link from 'next/link'

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
						"description": "Planopia to nowoczesna aplikacja do ewidencji czasu pracy online. Pozwala prowadzić rejestrację godzin pracy, nadgodzin i urlopów w prosty sposób. Dostępna darmowa wersja do 8 użytkowników.",
						"image": "https://planopia.pl/img/desktop.png",
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
						"datePublished": "2025-08-25"
					})
				}}
			/>

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
						<Link href="/en/blog/time-tracking-online" className="flex items-center languagechoose">
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
						<Link
							href="/en/blog/time-tracking-online"
							className="flex items-center languagechoose"
							style={{ marginTop: '15px' }}>
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</div>
				)}
			</header>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero" style={{ marginTop: '70px' }}>
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

							{/* CTA boxy */}
							<div className="mt-6 grid sm:grid-cols-2 gap-4 cta-blog">
								<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
									<p className="text-gray-800 mb-3">
										👉 <strong>Darmowa aplikacja do ewidencji czasu pracy</strong>  
										<br />dla zespołów do 8 użytkowników
									</p>
									<Link
										href="https://app.planopia.pl/team-registration"
										className="inline-block first-cta bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition"
									>
										Załóż darmowy zespół
									</Link>
								</div>
								<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
									<p className="text-gray-800 mb-3">
									👉 <strong>Dla większych firm: </strong>  
									nielimitowana liczba użytkowników, większe możliwości i elastyczność
									</p>
									<Link
										href="/#cennik"
										className="inline-block sec-cta bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
									>
										Zobacz cennik
									</Link>
								</div>
							</div>
						</div>

						<img
							src="/img/desktop.png"
							alt="Program do planowania urlopów – Planopia"
							className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
						/>
						<img
							src="/img/mobile.png"
							alt="Program do planowania urlopów – Planopia"
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

				<h2 className="text-2xl font-semibold mb-3">Program do ewidencji czasu pracy – co powinien mieć?</h2>
				<p className="mb-4 text-gray-700">
					Nowoczesne aplikacje do ewidencji czasu pracy powinny być dostępne z dowolnego miejsca, 
					proste w obsłudze i bezpieczne. Oto kluczowe funkcje:
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
					<li>Wersję darmową dla zespołów do 8 użytkowników.</li>
					<li>Możliwość rozbudowy i personalizacji dla większych firm.</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Podsumowanie</h2>
				<p className="mb-4 text-gray-700">
					Ewidencja czasu pracy nie musi być skomplikowana. Dzięki aplikacjom takim jak 
					<strong> Planopia</strong>, Twoja firma oszczędza czas, unika błędów i działa zgodnie z przepisami.  
					Niezależnie, czy masz <strong>mały zespół do 8 osób</strong>, czy dużą organizację – 
					z Planopią wszystko masz pod kontrolą.
				</p>

				<p className="mt-8 font-medium text-blue-600">
					Wypróbuj Planopię – <Link href="https://app.planopia.pl/team-registration" className="underline">załóż darmowy zespół już dziś</Link>.
				</p>
			</article>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default BlogOne
