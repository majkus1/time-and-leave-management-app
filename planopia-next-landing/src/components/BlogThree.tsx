'use client'

import { useState } from 'react'
import Link from 'next/link'

function BlogThree() {
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
						"headline": "Planowanie urlopów pracowników – jak uniknąć chaosu w firmie?",
						"description": "Dowiedz się, jak usprawnić planowanie urlopów i nieobecności w Twojej firmie. Sprawdź, jak Planopia pomaga HR w prowadzeniu kalendarza urlopowego online.",
						"image": "https://planopia.pl/img/planvacationblog.webp",
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
						"url": "https://planopia.pl/blog/planowanie-urlopow",
						"datePublished": "2025-08-25"
					})
				}}
			/>

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link href="/" className="logoinmenu text-2xl font-bold text-blue-700 companyname" style={{ marginBottom: '0px' }}>
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
						<Link href="/en/blog/leave-planning" className="flex items-center languagechoose">
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
							href="/en/blog/leave-planning"
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
								Planowanie urlopów pracowników – najlepsze narzędzia i praktyki
							</h1>
							<p className="text-gray-700 text-lg">
								<strong>Planowanie urlopów</strong> to jedno z najczęstszych wyzwań w działach HR i u menedżerów zespołów. 
								Tradycyjne metody – papierowe wnioski czy Excel – prowadzą do chaosu i błędów. 
								Dowiedz się, jak <strong>kalendarz urlopowy online</strong> i aplikacje takie jak Planopia 
								pomagają w prostym i skutecznym zarządzaniu nieobecnościami.
							</p>

							{/* CTA boxy */}
							<div className="mt-6 grid sm:grid-cols-2 gap-4 cta-blog">
								<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
									<p className="text-gray-800 mb-3">
										👉 <strong>Darmowa aplikacja do planowania urlopów</strong>  
										<br />dla zespołów do 6 użytkowników
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
									nielimitowana liczba użytkowników, elastyczne funkcje i integracje
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
							src="/img/desktopnew.webp"
							alt="Program do planowania urlopów – Planopia"
							className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
						/>
						<img
							src="/img/mobilenew.webp"
							alt="Program do planowania urlopów – Planopia"
							className="rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile"
						/>
					</div>
				</div>
			</section>

			<article className="max-w-6xl mx-auto px-6 py-12">
				<h2 className="text-2xl font-semibold mb-3">Dlaczego planowanie urlopów jest kluczowe?</h2>
				<p className="mb-4 text-gray-700">
					Brak przejrzystości w urlopach powoduje konflikty, niedobory kadrowe i spadek efektywności. 
					 <strong> Centralny kalendarz urlopowy</strong> pozwala zachować ciągłość pracy i unikać sytuacji, w których kilku 
					kluczowych pracowników znika w tym samym czasie. Dobre zarządzanie urlopami wspiera także morale i satysfakcję pracowników.
				</p>

				<h2 className="text-2xl font-semibold mb-3">Najczęstsze problemy w zarządzaniu urlopami</h2>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Brak wspólnego kalendarza urlopowego dla zespołu</li>
					<li>Ręczne wnioski w Excelu lub na papierze – podatne na błędy</li>
					<li>Brak automatycznych powiadomień o wnioskach</li>
					<li>Pokrywające się urlopy kluczowych osób</li>
					<li>Brak historii urlopowej i łatwego dostępu do raportów</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Jak usprawnić planowanie urlopów?</h2>
				<p className="mb-4 text-gray-700">
					Wdrożenie <strong>aplikacji do urlopów</strong> rozwiązuje większość problemów. Dzięki Planopii możesz:
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Udostępnić pracownikom wspólny kalendarz nieobecności</li>
					<li>Automatycznie wysyłać powiadomienia do przełożonych</li>
					<li>Wprowadzić role i priorytety w akceptacji urlopów</li>
					<li>Unikać konfliktów urlopowych dzięki widoczności całego zespołu</li>
					<li>Eksportować dane do raportów w PDF i XLSX</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Planopia – aplikacja do planowania urlopów</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> to prosta w obsłudze aplikacja, która łączy <strong>ewidencję czasu pracy</strong> 
					z planowaniem urlopów. Wersja darmowa pozwala na korzystanie z systemu w zespołach do 6 osób. 
					W płatnych planach otrzymasz dodatkowe funkcje – nielimitowaną liczbę użytkowników, personalizację 
					i integracje z innymi systemami.
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Pracownicy składają wnioski urlopowe online</li>
					<li>Menedżerowie akceptują wnioski jednym kliknięciem</li>
					<li>Urlopy trafiają od razu do kalendarza zespołu</li>
					<li>Historia i raporty urlopów w jednym miejscu</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3">Podsumowanie</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planowanie urlopów online</strong> to sposób na porządek, przejrzystość i mniej stresu w zarządzaniu firmą. 
					Dzięki aplikacji Planopia unikniesz chaosu, przyspieszysz akceptacje i zyskasz kontrolę nad dostępnością zespołu. 
					Sprawdź darmową wersję dla <strong>zespołów do 6 osób</strong> i zobacz, jak łatwe może być zarządzanie urlopami.
				</p>

				<p className="mt-8 font-medium text-blue-600">
					Wypróbuj Planopię – <Link href="https://app.planopia.pl/team-registration" className="underline">załóż darmowy zespół i zacznij planować urlopy online</Link>.
				</p>
			</article>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default BlogThree
