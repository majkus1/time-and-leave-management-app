import Link from 'next/link'
import AnimatedBlogImages from './AnimatedBlogImages'

export default function BlogHolidays2026Content() {
	const blogPostingSchema = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"headline": "Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy w Polsce",
		"description": "Kompletny kalendarz dni wolnych 2026 w Polsce. Sprawdź wszystkie święta ustawowe, długie weekendy i dowiedz się, jak efektywnie zaplanować urlopy w 2026 roku.",
		"image": ["https://planopia.pl/img/plans-urlopnew.webp"],
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
		"url": "https://planopia.pl/blog/dni-wolne-2026",
		"datePublished": "2026-01-05",
		"dateModified": "2026-01-05",
		"inLanguage": "pl-PL",
		"keywords": "dni wolne 2026, święta 2026, kalendarz dni wolnych 2026, dni ustawowo wolne 2026, planowanie urlopów 2026, roczny plan urlopów 2026 excel darmowy, program do urlopów darmowy",
		"mainEntityOfPage": {
			"@type": "WebPage",
			"@id": "https://planopia.pl/blog/dni-wolne-2026"
		}
	}

	return (
		<>
			{/* Schema.org JSON-LD - BlogPosting */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(blogPostingSchema)
				}}
			/>

			{/* HERO */}
			<section className="px-4 py-10 bg-gradient-to-r from-blue-50 to-white" id="blog-hero" style={{ marginTop: '70px' }}>
				<div className="max-w-7xl mx-auto text-left content-blog">
					<div className="grid xl:grid-cols-2 gap-10 items-center">
						<div>
							<h1 className="text-4xl font-bold mb-6">
								Dni wolne 2026 – kompletny kalendarz świąt w Polsce
							</h1>
							<p className="text-gray-700 text-lg">
								Sprawdź <strong>wszystkie dni wolne 2026</strong> w Polsce. Kompletny <strong>kalendarz świąt ustawowych</strong> 
								z informacją o długich weekendach i poradami, jak efektywnie <strong>zaplanować urlopy w 2026 roku</strong>. 
								Dowiedz się, które dni są ustawowo wolne od pracy i jak najlepiej wykorzystać długie weekendy.
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

						<AnimatedBlogImages
							desktopImages={[
								{
									src: '/img/plans-urlopnew.webp',
									alt: 'Kalendarz dni wolnych 2026 – planowanie urlopów w Planopia'
								},
								{
									src: '/img/wniosek-urlop.webp',
									alt: 'Wniosek urlopowy online – Planopia'
								}
							]}
							mobileImages={[
								{
									src: '/img/plans-urlop-mobnew.webp',
									alt: 'Aplikacja do planowania urlopów – Planopia widok mobilny'
								},
								{
									src: '/img/wniosek-urlop-mob.webp',
									alt: 'Wniosek urlopowy online – Planopia widok mobilny'
								}
							]}
							interval={5000}
						/>
					</div>
				</div>
			</section>

			<main>
				<article className="max-w-6xl mx-auto px-6 py-12">
					<h2 className="text-2xl font-semibold mb-3">Kalendarz dni wolnych 2026 – lista wszystkich świąt</h2>
					<p className="mb-4 text-gray-700">
						W 2026 roku w Polsce mamy <strong>13 dni ustawowo wolnych od pracy</strong>. Poniżej znajdziesz kompletną listę 
						wszystkich świąt z datami i dniami tygodnia, aby móc zaplanować urlopy i długie weekendy.
					</p>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Styczeń 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">1 stycznia (czwartek)</span>
								<span>Nowy Rok, Świętej Bożej Rodzicielki Maryi</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">6 stycznia (wtorek)</span>
								<span>Trzech Króli (Objawienie Pańskie)</span>
							</li>
						</ul>
					</div>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Kwiecień 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">5 kwietnia (niedziela)</span>
								<span>Wielkanoc</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">6 kwietnia (poniedziałek)</span>
								<span>Poniedziałek Wielkanocny</span>
							</li>
						</ul>
					</div>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Maj 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">1 maja (piątek)</span>
								<span>Święto Pracy</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">3 maja (niedziela)</span>
								<span>Święto Konstytucji 3 Maja</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">24 maja (niedziela)</span>
								<span>Zesłanie Ducha Świętego (Zielone Świątki)</span>
							</li>
						</ul>
					</div>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Czerwiec 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">4 czerwca (czwartek)</span>
								<span>Boże Ciało</span>
							</li>
						</ul>
					</div>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Sierpień 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">15 sierpnia (sobota)</span>
								<span>Święto Wojska Polskiego, Wniebowzięcie Najświętszej Maryi Panny</span>
							</li>
						</ul>
						<p className="text-sm text-gray-600 mt-3">
							<strong>Uwaga:</strong> 15 sierpnia przypada w sobotę. Zgodnie z przepisami, pracownikom przysługuje dodatkowy dzień wolny do odbioru.
						</p>
					</div>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Listopad 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">1 listopada (niedziela)</span>
								<span>Wszystkich Świętych</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">11 listopada (środa)</span>
								<span>Święto Niepodległości</span>
							</li>
						</ul>
					</div>

					<div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
						<h3 className="text-xl font-semibold mb-4 text-gray-900">Grudzień 2026</h3>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">24 grudnia (czwartek)</span>
								<span>Wigilia Bożego Narodzenia</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">25 grudnia (piątek)</span>
								<span>Boże Narodzenie (pierwszy dzień)</span>
							</li>
							<li className="flex items-start">
								<span className="font-semibold text-gray-900 min-w-[140px]">26 grudnia (sobota)</span>
								<span>Boże Narodzenie (drugi dzień)</span>
							</li>
						</ul>
						<p className="text-sm text-gray-600 mt-3">
							<strong>Uwaga:</strong> 26 grudnia przypada w sobotę. Zgodnie z przepisami, pracownikom przysługuje dodatkowy dzień wolny do odbioru.
						</p>
					</div>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Długie weekendy w 2026 roku – jak zaplanować urlopy?</h2>
					<p className="mb-4 text-gray-700">
						Planując urlopy w 2026 roku, warto wykorzystać <strong>długie weekendy</strong>. Oto najlepsze okazje do przedłużenia 
						okresów wypoczynku poprzez dołączenie kilku dni urlopu:
					</p>

					<h3 className="text-xl font-semibold mb-3 mt-6">Styczeń 2026</h3>
					<p className="mb-4 text-gray-700">
						<strong>1 stycznia (czwartek)</strong> to Nowy Rok. Jeśli weźmiesz urlop w piątek 2 stycznia, zyskasz 4 dni wolne 
						(1-4 stycznia). <strong>6 stycznia (wtorek)</strong> to Trzech Króli – biorąc wolne w poniedziałek 5 stycznia, 
						zyskasz długi weekend (3-6 stycznia).
					</p>

					<h3 className="text-xl font-semibold mb-3 mt-6">Majówka 2026</h3>
					<p className="mb-4 text-gray-700">
						<strong>1 maja (piątek)</strong> to Święto Pracy. To już długi weekend! Jeśli weźmiesz urlop w poniedziałek 4 maja, 
						zyskasz 4 dni wolne (1-4 maja). <strong>3 maja (niedziela)</strong> to Święto Konstytucji 3 Maja. 
						Biorąc wolne od 29 kwietnia do 2 maja (poniedziałek-czwartek), możesz mieć nawet 9 dni wolnych (29 kwietnia - 3 maja).
					</p>

					<h3 className="text-xl font-semibold mb-3 mt-6">Czerwiec 2026 – Boże Ciało</h3>
					<p className="mb-4 text-gray-700">
						<strong>4 czerwca (czwartek)</strong> to Boże Ciało. Biorąc wolne w piątek 5 czerwca, zyskasz 4 dni wolne 
						(4-7 czerwca – czwartek-niedziela).
					</p>

					<h3 className="text-xl font-semibold mb-3 mt-6">Listopad 2026</h3>
					<p className="mb-4 text-gray-700">
						<strong>11 listopada (środa)</strong> to Święto Niepodległości. Biorąc wolne w poniedziałek 9 i wtorek 10 listopada, 
						zyskasz 5 dni wolnych (9-13 listopada).
					</p>

					<h3 className="text-xl font-semibold mb-3 mt-6">Grudzień 2026 – Święta Bożego Narodzenia</h3>
					<p className="mb-4 text-gray-700">
						<strong>24-26 grudnia</strong> to Wigilia i Boże Narodzenie. 25 grudnia to piątek, a 26 grudnia to sobota 
						(z dodatkowym dniem wolnym do odbioru). Biorąc urlop od 27 do 31 grudnia (poniedziałek-piątek) i odbierając dzień 
						za 26 grudnia, możesz mieć nawet 10 dni wolnych (24 grudnia - 2 stycznia 2027).
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Święta przypadające w weekend – dodatkowe dni wolne</h2>
					<p className="mb-4 text-gray-700">
						W 2026 roku niektóre święta przypadają w sobotę lub niedzielę. Zgodnie z przepisami prawa pracy, 
						jeśli święto ustawowo wolne od pracy przypada w sobotę, pracownikowi przysługuje <strong>dodatkowy dzień wolny</strong> 
						do wykorzystania w innym terminie. W 2026 roku dotyczy to:
					</p>
					<ul className="list-disc pl-6 mb-4 text-gray-700">
						<li><strong>15 sierpnia (sobota)</strong> – Wniebowzięcie Najświętszej Maryi Panny – dzień wolny do odbioru</li>
						<li><strong>26 grudnia (sobota)</strong> – Boże Narodzenie (drugi dzień) – dzień wolny do odbioru</li>
					</ul>
					<p className="mb-4 text-gray-700">
						Te dodatkowe dni wolne możesz wykorzystać w dowolnym terminie, co daje jeszcze więcej możliwości 
						planowania długich weekendów i urlopów.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Planowanie urlopów w 2026 roku – praktyczne porady</h2>
					<p className="mb-4 text-gray-700">
						Aby efektywnie wykorzystać dni wolne w 2026 roku, warto zaplanować urlopy z wyprzedzeniem. 
						Wiele osób tworzy <strong>roczny plan urlopów 2026 w Excelu</strong> – to sprawdzona metoda, ale może być 
						czasochłonna i podatna na błędy, szczególnie gdy trzeba koordynować urlopy całego zespołu. 
						Oto kilka praktycznych porad:
					</p>
					<ul className="list-disc pl-6 mb-4 text-gray-700">
						<li><strong>Planuj z wyprzedzeniem</strong> – im wcześniej złożysz wniosek urlopowy, tym większe szanse na akceptację</li>
						<li><strong>Sprawdź kalendarz</strong> – zapoznaj się z wszystkimi świętami i długimi weekendami</li>
						<li><strong>Wykorzystaj długie weekendy</strong> – kilka dni urlopu może przedłużyć okres wypoczynku nawet do 9-10 dni</li>
						<li><strong>Koordynuj z zespołem</strong> – unikaj sytuacji, w której wielu pracowników bierze urlop jednocześnie</li>
						<li><strong>Pamiętaj o dniach do odbioru</strong> – wykorzystaj dodatkowe dni wolne za święta przypadające w sobotę</li>
					</ul>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Program do urlopów darmowy – alternatywa dla Excela</h2>
					<p className="mb-4 text-gray-700">
						<strong>Planowanie urlopów</strong> w firmie może być skomplikowane, szczególnie gdy masz do czynienia z większym zespołem. 
						Chociaż wiele osób korzysta z <strong>rocznego planu urlopów 2026 w Excelu</strong>, istnieją lepsze rozwiązania. 
						<Link href="/blog/planowanie-urlopow" className="text-blue-600 hover:underline font-semibold"> Planopia to darmowy program do urlopów</Link>, 
						który pomaga w prosty i efektywny sposób zarządzać urlopami pracowników. Dzięki <strong>kalendarzowi urlopowemu online</strong> możesz:
					</p>
					<ul className="list-disc pl-6 mb-4 text-gray-700">
						<li>Widzieć wszystkie wnioski urlopowe w jednym miejscu</li>
						<li>Unikać konfliktów – widzisz, kiedy inni pracownicy są na urlopie</li>
						<li>Składać wnioski urlopowe online</li>
						<li>Akceptować lub odrzucać wnioski jednym kliknięciem</li>
						<li>Eksportować wnioski urlopowe do PDF</li>
						<li>Automatycznie śledzić wykorzystane i pozostałe dni urlopowe</li>
					</ul>
					<p className="mb-4 text-gray-700">
						<Link href="/blog/planowanie-urlopow" className="text-blue-600 hover:underline">Dowiedz się więcej o planowaniu urlopów z Planopią</Link> 
						{' '}i zobacz, jak aplikacja może usprawnić zarządzanie urlopami w Twojej firmie.
					</p>

					<h2 className="text-2xl font-semibold mb-3 mt-8">Podsumowanie – dni wolne 2026</h2>
					<p className="mb-4 text-gray-700">
						W 2026 roku w Polsce mamy <strong>13 dni ustawowo wolnych od pracy</strong>. Dwa z nich (15 sierpnia i 26 grudnia) 
						przypadają w sobotę, co daje pracownikom dodatkowe dni wolne do odbioru. Dzięki odpowiedniemu planowaniu urlopów 
						możesz wykorzystać długie weekendy i przedłużyć okresy wypoczynku nawet do 9-10 dni.
					</p>
					<p className="mb-4 text-gray-700">
						Pamiętaj, że <strong>planowanie urlopów z wyprzedzeniem</strong> zwiększa szanse na akceptację wniosków przez pracodawcę 
						i pozwala na lepsze wykorzystanie dni wolnych. Jeśli zarządzasz urlopami w firmie, rozważ użycie <strong>darmowego programu do urlopów</strong>, 
						która ułatwi koordynację i uniknięcie konfliktów. Zamiast tworzyć <strong>roczny plan urlopów 2026 w Excelu</strong>, możesz 
						skorzystać z nowoczesnego rozwiązania, które automatyzuje proces i eliminuje ryzyko błędów.
					</p>

					<p className="mt-8 font-medium text-blue-600">
						Wypróbuj Planopię – <Link href="https://app.planopia.pl/team-registration" className="underline">załóż darmowy zespół i zacznij planować urlopy online</Link>.
					</p>
				</article>
			</main>

			{/* FOOTER */}
			<footer className="py-10 px-6 bg-white border-t text-center d-flex justify-center">
				<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
			</footer>
		</>
	)
}

