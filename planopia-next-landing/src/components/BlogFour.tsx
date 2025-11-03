'use client'

import { useState } from 'react'
import Link from 'next/link'

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
								"url": "https://planopia.pl/img/new-logoplanopia.webp"
							}
						},
						"description": "Odkryj Planopię - darmową aplikację do ewidencji czasu pracy i zarządzania urlopami dla zespołów do 8 osób. Pełna funkcjonalność bez opłat.",
						"image": "https://planopia.pl/img/desktop.webp"
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
						<Link href="/en/blog/free-time-tracking-app" className="flex items-center languagechoose">
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
						<Link href="/en/blog/free-time-tracking-app" className="flex items-center languagechoose" style={{ marginTop: '15px' }}>
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
							<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 blogh1 text-center mt-4">
								Darmowa aplikacja do ewidencji czasu pracy i urlopów
							</h1>
							<p className="text-xl text-gray-600 text-center max-w-4xl mx-auto mb-8">
								Odkryj Planopię - kompletną, darmową aplikację do ewidencji czasu pracy i zarządzania urlopami. 
								Pełna funkcjonalność dla zespołów do 8 osób bez żadnych opłat.
							</p>
							<div className="text-center">
								<Link
									href="https://app.planopia.pl/team-registration"
									className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
								>
									Załóż darmowy zespół już dziś
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
							Dlaczego potrzebujesz darmowej aplikacji do ewidencji czasu pracy?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Ewidencja czasu pracy to obowiązek każdej firmy, ale tradycyjne metody często są nieefektywne i czasochłonne. 
							Excel, papierowe listy obecności czy podstawowe systemy HR generują błędy i pochłaniają cenne godziny pracy.
						</p>
						<p className="text-lg text-gray-700 mb-6">
							<strong>Planopia to darmowa aplikacja do ewidencji czasu pracy</strong>, która rozwiązuje wszystkie te problemy. 
							Oferuje pełną funkcjonalność bez ukrytych opłat, bez ograniczeń czasowych i bez konieczności podpisywania umów.
						</p>
					</div>

					{/* What is Planopia */}
					<div className="mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Czym jest Planopia - darmowa aplikacja do ewidencji czasu pracy?
						</h2>
						<p className="text-lg text-gray-700 mb-4">
							Planopia to nowoczesna, <strong>darmowa aplikacja do ewidencji czasu pracy i urlopów</strong>, 
							zaprojektowana z myślą o małych i średnich firmach. Aplikacja działa w przeglądarce internetowej, 
							więc nie wymaga instalacji oprogramowania na komputerach pracowników.
						</p>
						<div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
							<p className="text-lg text-blue-800 font-semibold">
								✅ Darmowa aplikacja do ewidencji czasu pracy dla zespołów do 8 osób
							</p>
							<p className="text-blue-700 mt-2">
								Bez ukrytych opłat, bez okresów próbnych, bez konieczności podawania danych karty kredytowej.
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
									<li>• Offline mode</li>
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
										<th className="border border-gray-300 p-4 text-center">Planopia (DARMOWA)</th>
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
							Jak zacząć korzystać z darmowej aplikacji do ewidencji czasu pracy?
						</h2>
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center p-6 bg-green-50 rounded-lg">
								<div className="text-4xl font-bold text-green-600 mb-2">1</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3 justify-center">Załóż zespół</h3>
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
									Czy Planopia jest naprawdę darmowa?
								</h3>
								<p className="text-gray-700">
									Tak! Planopia oferuje pełną funkcjonalność dla zespołów do 8 osób bez żadnych opłat. 
									Nie ma ukrytych kosztów, okresów próbnych ani konieczności podawania danych karty kredytowej.
								</p>
							</div>
							<div className="bg-gray-50 p-6 rounded-lg">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Jak długo mogę korzystać z darmowej wersji?
								</h3>
								<p className="text-gray-700">
									Bez ograniczeń czasowych! Darmowa aplikacja do ewidencji czasu pracy Planopia 
									jest dostępna na zawsze dla zespołów do 8 osób.
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
					<div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
						<h2 className="text-3xl font-bold text-gray-900 mb-4 justify-center">
							Gotowy na darmową aplikację do ewidencji czasu pracy?
						</h2>
						<p className="text-xl text-gray-700 mb-6">
							Dołącz do tysięcy firm, które już korzystają z Planopii!
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-green-700 transition text-lg white-text-btn"
						>
							Załóż darmowy zespół już dziś
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

export default BlogFour
