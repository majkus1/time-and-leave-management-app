'use client'

import { useState } from 'react'
import Link from 'next/link'

function BlogSeven() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)

	return (
		<>
			{/* Schema.org JSON-LD - BlogPosting */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "BlogPosting",
						"headline": "Kompleksowa aplikacja do zarządzania firmą – wszystko w jednym miejscu",
						"description": "Planopia to kompleksowa aplikacja do zarządzania firmą. Ewidencja czasu pracy, urlopy, grafiki pracy, czaty, tablice zadań i elastyczna konfiguracja ról. Wszystko w jednym narzędziu dla Twojego zespołu.",
						"image": "https://planopia.pl/img/worktimeblog.webp",
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
						"url": "https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma",
						"datePublished": "2026-01-03",
						"dateModified": "2026-01-03",
						"inLanguage": "pl-PL",
						"wordCount": 1800,
						"keywords": "kompleksowa aplikacja do zarządzania firmą, ewidencja czasu pracy, zarządzanie urlopami, grafiki pracy, czaty zespołowe, tablice zadań, konfiguracja ról, Planopia",
						"mainEntityOfPage": {
							"@type": "WebPage",
							"@id": "https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma"
						}
					})
				}}
			/>
			{/* Schema.org JSON-LD - FAQPage */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "FAQPage",
						"mainEntity": [
							{
								"@type": "Question",
								"name": "Czy Planopia jest darmowa?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "Tak, Planopia oferuje darmową wersję dla zespołów do 6 użytkowników. Wszystkie funkcje są dostępne bez opłat. Dla większych firm dostępne są plany płatne z nielimitowaną liczbą użytkowników."
								}
							},
							{
								"@type": "Question",
								"name": "Czy aplikacja umożliwia prowadzenie ewidencji czasu pracy?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "Tak, Planopia umożliwia prowadzenie ewidencji czasu pracy zgodnie z typowymi wymaganiami. Aplikacja wspiera proces rejestracji godzin pracy, nadgodzin, generowania raportów i eksportu danych do PDF oraz Excel potrzebnych do dokumentacji."
								}
							},
							{
								"@type": "Question",
								"name": "Czy można eksportować dane do Excela?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "Tak, Planopia umożliwia eksport danych do formatów PDF i Excel. Możesz eksportować kalendarze pracy, raporty urlopowe i inne dane w formacie odpowiednim do dalszej analizy."
								}
							},
							{
								"@type": "Question",
								"name": "Czy aplikacja działa na telefonie?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "Tak, Planopia działa jako Progressive Web App (PWA), co oznacza, że możesz dodać ją do ekranu głównego telefonu lub tabletu i używać jak natywnej aplikacji mobilnej. Wszystkie funkcje są dostępne na urządzeniach mobilnych."
								}
							},
							{
								"@type": "Question",
								"name": "Jakie funkcje oferuje kompleksowa aplikacja Planopia?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "Planopia łączy w sobie ewidencję czasu pracy, zarządzanie urlopami, grafiki pracy, czaty zespołowe, tablice zadań (Kanban) i elastyczną konfigurację ról. Wszystko w jednej aplikacji, bez potrzeby korzystania z wielu osobnych narzędzi."
								}
							}
						]
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
						<Link href="/en/blog/comprehensive-company-management-app" className="flex items-center languagechoose">
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
							href="/en/blog/comprehensive-company-management-app"
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
								Kompleksowa aplikacja do zarządzania firmą – wszystko w jednym miejscu
							</h1>
							<p className="text-gray-700 text-lg">
								<strong>Planopia</strong> to nie tylko aplikacja do ewidencji czasu pracy i urlopów. 
								To kompleksowe narzędzie do zarządzania firmą, które łączy w sobie <strong>ewidencję czasu pracy</strong>, 
								 <strong> zarządzanie urlopami</strong>, <strong>grafiki pracy</strong>, <strong>czaty zespołowe</strong>, 
								<strong> tablice zadań</strong> i elastyczną <strong>konfigurację ról</strong>. Wszystko w jednym miejscu, 
								dla całego zespołu.
							</p>

							{/* CTA boxy */}
							<div className="mt-6 grid sm:grid-cols-2 gap-4 cta-blog">
								<div className="bg-white border border-gray-200 rounded-xl py-5 px-4 shadow-sm text-center">
									<p className="text-gray-800 mb-3">
										👉 <strong>Darmowa aplikacja</strong>  
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

						<figure>
							<img
								src="/img/desktopnew.webp"
								alt="Kompleksowa aplikacja do zarządzania firmą – Planopia"
								className="rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop"
							/>
							<figcaption className="text-sm text-gray-600 mt-2 text-center figcaption-desktop">Kompleksowa aplikacja do zarządzania firmą – Planopia</figcaption>
						</figure>
						<figure>
							<img
								src="/img/mobilenew.webp"
								alt="Kompleksowa aplikacja do zarządzania firmą – Planopia"
								className="rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile"
							/>
							<figcaption className="text-sm text-gray-600 mt-2 text-center figcaption-mobile">Planopia – widok mobilny</figcaption>
						</figure>
					</div>
				</div>
			</section>

			<main>
				<article className="max-w-6xl mx-auto px-6 py-12">
					<h2 className="text-2xl font-semibold mb-3">Dlaczego warto wybrać kompleksową aplikację do zarządzania firmą?</h2>
				<p className="mb-4 text-gray-700">
					Współczesne firmy potrzebują narzędzi, które łączą różne aspekty zarządzania zespołem w jednym miejscu. 
					Zamiast korzystać z wielu osobnych aplikacji – do ewidencji czasu, urlopów, komunikacji i zarządzania projektami – 
					możesz mieć <strong>wszystko w jednej aplikacji</strong>. To oszczędza czas, redukuje koszty i zwiększa efektywność pracy.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Ewidencja czasu pracy i zarządzanie urlopami</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> oferuje pełną <Link href="/blog/ewidencja-czasu-pracy-online" className="text-blue-600 hover:underline font-semibold">ewidencję czasu pracy</Link> z kalendarzem, nadgodzinami i podsumowaniami. 
					Pracownicy mogą łatwo rejestrować godziny pracy, a menedżerowie mają dostęp do szczegółowych raportów. 
					<Link href="/blog/planowanie-urlopow" className="text-blue-600 hover:underline"> Wnioski urlopowe</Link> są składane online, akceptowane jednym kliknięciem i automatycznie trafiają do kalendarza zespołu. 
					Wszystkie dane można eksportować do <strong>PDF i Excel</strong>.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Grafiki pracy</h2>
				<p className="mb-4 text-gray-700">
					Moduł <strong>grafików pracy</strong> pozwala na planowanie i zarządzanie harmonogramami dla całego zespołu. 
					Możesz tworzyć grafiki na miesiące do przodu, przypisywać pracowników do konkretnych zmian, 
					monitorować pokrycie godzin i unikać konfliktów. Grafiki są widoczne dla całego zespołu, 
					co zwiększa przejrzystość i ułatwia planowanie.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Czaty i komunikacja wewnętrzna</h2>
				<p className="mb-4 text-gray-700">
					<strong>Czaty zespołowe</strong> i kanały działów umożliwiają szybką komunikację wewnętrzną bez potrzeby korzystania 
					z zewnętrznych narzędzi. Możesz tworzyć kanały dla poszczególnych działów, projektów lub tematów. 
					Wszystkie rozmowy są w jednym miejscu, co ułatwia śledzenie ważnych informacji i decyzji.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Tablice zadań i zarządzanie projektami</h2>
				<p className="mb-4 text-gray-700">
					<strong>Tablice zadań</strong> w stylu Kanban pozwalają na zarządzanie projektami i zadaniami w przejrzysty sposób. 
					Możesz tworzyć tablice dla różnych projektów, przypisywać zadania do członków zespołu, 
					śledzić postępy i zarządzać priorytetami. Wszystko w jednym miejscu, bez potrzeby korzystania z osobnych narzędzi.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Elastyczna konfiguracja ról i uprawnień</h2>
				<p className="mb-4 text-gray-700">
					Jedną z najważniejszych zalet <strong>Planopii</strong> jest dobrze przemyślana <strong>logika ról</strong> i możliwość 
					<strong> konfiguracji uprawnień</strong>. Możesz tworzyć własne role, przypisywać im konkretne uprawnienia do poszczególnych 
					modułów i funkcji. Dzięki temu każdy użytkownik ma dostęp tylko do tego, czego potrzebuje, 
					a bezpieczeństwo danych jest zachowane. System ról jest elastyczny i można go dostosować do specyfiki każdej firmy.
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Tworzenie własnych ról z określonymi uprawnieniami</li>
					<li>Przypisywanie ról do użytkowników i działów</li>
					<li>Kontrola dostępu do poszczególnych modułów (ewidencja, urlopy, grafiki, czaty, tablice)</li>
					<li>Możliwość nadawania uprawnień do akceptacji wniosków i zarządzania danymi</li>
					<li>Elastyczna konfiguracja dostosowana do procesów w firmie</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Wszystko w jednym miejscu</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> łączy wszystkie te funkcje w jednej aplikacji, co oznacza:
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li>Jeden login i hasło dla całego zespołu</li>
					<li>Wspólna baza danych – wszystkie informacje są zsynchronizowane</li>
					<li>Mniej kosztów – nie musisz płacić za wiele osobnych narzędzi</li>
					<li>Łatwiejsze wdrożenie – jeden system zamiast kilku</li>
					<li>Lepsza integracja – wszystkie moduły działają razem</li>
					<li>Wygodniejsza obsługa – jeden interfejs do nauki</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Dla kogo jest Planopia?</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> sprawdza się zarówno w małych zespołach, jak i w większych firmach:
				</p>
				<ul className="list-disc pl-6 mb-4 text-gray-700">
					<li><strong>Małe zespoły</strong> – darmowa wersja dla do 6 użytkowników, wszystkie funkcje dostępne</li>
					<li><strong>Średnie firmy</strong> – nielimitowana liczba użytkowników, elastyczna konfiguracja</li>
					<li><strong>Duże organizacje</strong> – możliwość personalizacji, integracji i dedykowanego środowiska</li>
					<li><strong>HR i menedżerowie</strong> – kompleksowe narzędzie do zarządzania zespołem</li>
				</ul>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Bezpieczeństwo i prywatność</h2>
				<p className="mb-4 text-gray-700">
					Wszystkie dane w <strong>Planopii</strong> są bezpiecznie przechowywane i szyfrowane. 
					Bezpieczne logowanie, szyfrowane połączenia i kontrola dostępu poprzez system ról 
					zapewniają, że tylko uprawnione osoby mają dostęp do danych Twojej firmy.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">PWA i dostępność mobilna</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> działa jako <strong>Progressive Web App (PWA)</strong>, co oznacza, 
					że możesz dodać ją do ekranu głównego telefonu lub tabletu i używać jak natywnej aplikacji mobilnej. 
					Wszystkie funkcje są dostępne na urządzeniach mobilnych, co pozwala na pracę z dowolnego miejsca.
				</p>

				<h2 className="text-2xl font-semibold mb-3 mt-8">Podsumowanie</h2>
				<p className="mb-4 text-gray-700">
					<strong>Planopia</strong> to kompleksowa aplikacja do zarządzania firmą, która łączy w sobie 
					<strong> ewidencję czasu pracy</strong>, <strong>zarządzanie urlopami</strong>, <strong>grafiki pracy</strong>, 
					<strong> czaty zespołowe</strong>, <strong>tablice zadań</strong> i elastyczną <strong>konfigurację ról</strong>. 
					Dzięki dobrze przemyślanej logice ról i możliwości konfiguracji, możesz dostosować aplikację do specyfiki 
					swojej firmy. Wszystko w jednym miejscu, dla całego zespołu.
				</p>
				<p className="mb-4 text-gray-700">
					Wypróbuj <strong>Planopię</strong> za darmo dla zespołów do 6 użytkowników i zobacz, 
					jak kompleksowe narzędzie może usprawnić zarządzanie Twoją firmą.
				</p>

					<p className="mt-8 font-medium text-blue-600">
						Wypróbuj Planopię – <Link href="https://app.planopia.pl/team-registration" className="underline">załóż darmowy zespół i zacznij zarządzać firmą w jednym miejscu</Link>.
					</p>

					{/* FAQ Section */}
					<section className="mt-12 pt-8 border-t border-gray-200">
						<h2 className="text-2xl font-semibold mb-6">Najczęściej zadawane pytania</h2>
						<div className="space-y-6">
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Czy Planopia jest darmowa?</h3>
								<p className="text-gray-700">
									Tak, Planopia oferuje darmową wersję dla zespołów do 6 użytkowników. Wszystkie funkcje są dostępne bez opłat. 
									Dla większych firm dostępne są plany płatne z nielimitowaną liczbą użytkowników, elastycznymi funkcjami i integracjami.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Czy aplikacja umożliwia prowadzenie ewidencji czasu pracy?</h3>
								<p className="text-gray-700">
									Tak, Planopia umożliwia prowadzenie ewidencji czasu pracy zgodnie z typowymi wymaganiami. Aplikacja wspiera proces rejestracji godzin pracy, 
									nadgodzin, generowania raportów i eksportu danych do PDF oraz Excel potrzebnych do dokumentacji. 
									<Link href="/blog/elektroniczna-ewidencja-czasu-pracy" className="text-blue-600 hover:underline ml-1">Dowiedz się więcej o elektronicznej ewidencji czasu pracy</Link>.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Czy można eksportować dane do Excela?</h3>
								<p className="text-gray-700">
									Tak, Planopia umożliwia eksport danych do formatów PDF i Excel. Możesz eksportować kalendarze pracy, 
									raporty urlopowe i inne dane w formacie odpowiednim do dalszej analizy lub archiwizacji.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Czy aplikacja działa na telefonie?</h3>
								<p className="text-gray-700">
									Tak, Planopia działa jako Progressive Web App (PWA), co oznacza, że możesz dodać ją do ekranu głównego telefonu 
									lub tabletu i używać jak natywnej aplikacji mobilnej. Wszystkie funkcje są dostępne na urządzeniach mobilnych, 
									co pozwala na pracę z dowolnego miejsca.
								</p>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Jakie funkcje oferuje kompleksowa aplikacja Planopia?</h3>
								<p className="text-gray-700">
									Planopia łączy w sobie <Link href="/#oaplikacji" className="text-blue-600 hover:underline">ewidencję czasu pracy</Link>, 
									<Link href="/blog/planowanie-urlopow" className="text-blue-600 hover:underline"> zarządzanie urlopami</Link>, 
									grafiki pracy, czaty zespołowe, tablice zadań (Kanban) i elastyczną konfigurację ról. 
									Wszystko w jednej aplikacji, bez potrzeby korzystania z wielu osobnych narzędzi.
								</p>
							</div>
						</div>
					</section>
				</article>
			</main>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

export default BlogSeven

