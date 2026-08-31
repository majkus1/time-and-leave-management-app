import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import { LANDING_APP_GALLERY_IMAGES } from '@/data/landingAppGallery'
import BlogArticleCredibility from './BlogArticleCredibility'

const canonical = 'https://planopia.pl/blog/jak-ulozyc-grafik-pracy-w-restauracji'
const registerHref = 'https://app.planopia.pl/team-registration'

const faqs = [
	{
		q: 'Od czego zacząć układanie grafiku pracy w restauracji?',
		a: 'Najpierw zbierz dostępność zespołu i zaplanuj minimalną obsadę dla każdej części lokalu oraz pory dnia. Dopiero potem przypisuj konkretne osoby, uwzględniając urlopy, nieobecności, kwalifikacje i obowiązujące zasady czasu pracy.',
	},
	{
		q: 'Czy grafik restauracji można prowadzić bez Excela?',
		a: 'Tak. System online pozwala przechowywać grafik, urlopy, zmiany i ewidencję godzin w jednym miejscu. Zmniejsza to ryzyko pracy na nieaktualnej wersji arkusza i ułatwia dostęp z telefonu.',
	},
	{
		q: 'Jak szybko znaleźć zastępstwo w gastronomii?',
		a: 'Pomaga aktualny widok grafiku i nieobecności oraz podział zespołu według ról. Kierownik może sprawdzić obsadę, skontaktować się z odpowiednimi osobami i opublikować zmianę harmonogramu w jednym systemie.',
	},
	{
		q: 'Czy Planopia sama gwarantuje zgodność grafiku z prawem pracy?',
		a: 'Nie. Planopia wspiera planowanie i porządkuje dane, ale nie zastępuje specjalisty kadrowego ani indywidualnej analizy przepisów, umów i systemów czasu pracy obowiązujących w firmie.',
	},
] as const

const steps = [
	{
		title: 'Zbierz dostępność, urlopy i ograniczenia',
		body: 'Zacznij od informacji, kiedy pracownicy mogą pracować, kto ma zaakceptowany urlop i jakie ograniczenia wynikają z umów lub ustaleń. Zbieranie tych danych w prywatnych wiadomościach szybko prowadzi do pominięć.',
	},
	{
		title: 'Rozpisz minimalną obsadę lokalu',
		body: 'Określ liczbę osób potrzebnych na sali, kuchni, barze, zmywaku i przy dostawach. Uwzględnij różnice między spokojnym porankiem, lunchem, wieczorem i weekendem zamiast kopiować identyczny skład na każdy dzień.',
	},
	{
		title: 'Przypisz role i kompetencje',
		body: 'Sama liczba osób nie wystarczy. Na zmianie muszą znaleźć się pracownicy potrafiący otworzyć lub zamknąć lokal, obsłużyć kasę, bar, kuchnię albo przyjąć dostawę.',
	},
	{
		title: 'Sprawdź odpoczynki i zasady czasu pracy',
		body: 'Przed publikacją zweryfikuj harmonogram pod kątem obowiązującego systemu czasu pracy, odpoczynków, dni wolnych i indywidualnych warunków zatrudnienia. Program organizacyjny może ułatwić planowanie, ale odpowiedzialność za kontrolę zgodności pozostaje po stronie pracodawcy.',
	},
	{
		title: 'Opublikuj jedną obowiązującą wersję',
		body: 'Pracownicy powinni wiedzieć, gdzie znajduje się aktualny grafik. Jeden widok online jest bezpieczniejszy operacyjnie niż kilka plików, zdjęcia tabeli i poprawki przesyłane w różnych grupach.',
	},
	{
		title: 'Obsłuż zmiany i nagłe nieobecności',
		body: 'Gdy ktoś zachoruje lub zmieni się rezerwacja grupowa, aktualizuj grafik w tym samym miejscu. Dzięki widokowi urlopów i obsady łatwiej ocenić, kogo można poprosić o zastępstwo.',
	},
	{
		title: 'Porównaj plan z faktycznymi godzinami',
		body: 'Po zakończeniu okresu zestaw zaplanowane zmiany z ewidencją czasu. To pozwala wykryć braki, omówić nadgodziny i przygotować uporządkowane podsumowanie dla właściciela lub księgowości.',
	},
] as const

export default function BlogRestaurantScheduleArticle() {
	const blogPostingSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: 'Jak ułożyć grafik pracy w restauracji? Praktyczny poradnik',
		description: 'Proces planowania grafiku gastronomii: dostępność, obsada sali i kuchni, zastępstwa, urlopy oraz ewidencja godzin.',
		image: ['https://planopia.pl/img/gastronomia.webp'],
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		},
		url: canonical,
		datePublished: '2026-07-17',
		dateModified: '2026-07-17',
		inLanguage: 'pl-PL',
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
		keywords: 'grafik pracy restauracja, grafik pracy gastronomia, grafik pracowników restauracji, program do grafiku restauracji',
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Planopia', item: 'https://planopia.pl' },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://planopia.pl/blog' },
			{ '@type': 'ListItem', position: 3, name: 'Grafik pracy w restauracji', item: canonical },
		],
	}

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map(faq => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

			<main className="bg-white overflow-x-hidden">
				<article className="max-w-4xl mx-auto px-4 pt-10 md:pt-14 pb-8 blogarticlecontent break-words">
					<header className="mb-9">
						<p className="text-sm font-semibold text-emerald-700 mb-3">Zarządzanie gastronomią · grafik pracy</p>
						<h1 className="construction-industry-h1 text-gray-900 mb-4 leading-tight">Jak ułożyć grafik pracy w restauracji? Praktyczny poradnik</h1>
						<p className="text-gray-600 text-lg leading-relaxed">
							Dobry grafik pracy restauracji musi połączyć dostępność ludzi, wymagane role, zmienny ruch gości i nieobecności. Poniżej znajdziesz proces, który pomaga przygotować czytelny harmonogram i ograniczyć poprawki przesyłane przez telefon.
						</p>
					</header>

					<section className="mb-10 rounded-xl border border-amber-200 bg-amber-50/60 p-5 md:p-7" aria-labelledby="restaurant-schedule-goal">
						<h2 id="restaurant-schedule-goal" className="text-2xl font-bold text-gray-900 mb-3">Co powinien zapewniać dobry grafik gastronomii?</h2>
						<p className="text-gray-700 mb-4">Menedżer powinien móc odpowiedzieć bez przeszukiwania wiadomości:</p>
						<ul className="list-disc pl-5 space-y-2 text-gray-700 m-0">
							<li>kto otwiera i zamyka lokal,</li>
							<li>czy każda strefa ma odpowiednią obsadę i kompetencje,</li>
							<li>kto ma urlop, zgłoszoną nieobecność lub ograniczoną dostępność,</li>
							<li>która wersja grafiku jest aktualna,</li>
							<li>jak zaplanowane zmiany mają się do faktycznie przepracowanych godzin.</li>
						</ul>
					</section>

					<section className="mb-10" aria-labelledby="restaurant-schedule-steps">
						<h2 id="restaurant-schedule-steps" className="text-2xl font-bold text-gray-900 mb-5">Jak ułożyć grafik pracy w restauracji krok po kroku</h2>
						<ol className="list-none space-y-4 m-0 p-0">
							{steps.map((step, index) => (
								<li key={step.title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 md:p-6">
									<div className="flex gap-4">
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold !text-white" aria-hidden>{index + 1}</span>
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
											<p className="text-gray-700 m-0 leading-relaxed">{step.body}</p>
										</div>
									</div>
								</li>
							))}
						</ol>
					</section>

					<section className="mb-10" aria-labelledby="schedule-and-timesheet">
						<h2 id="schedule-and-timesheet" className="text-2xl font-bold text-gray-900 mb-4">Grafik to plan. Ewidencja pokazuje wykonanie.</h2>
						<p className="text-gray-700 mb-4 leading-relaxed">
							Harmonogram informuje, kiedy pracownik powinien pracować. Ewidencja czasu zapisuje dane o rzeczywistym czasie pracy i nieobecnościach. Trzymanie obu obszarów w jednym środowisku ułatwia znalezienie rozbieżności i przygotowanie podsumowania miesiąca.
						</p>
						<p className="text-gray-700 leading-relaxed">
							Oficjalne informacje o czasie pracy i pracy zmianowej publikuje{' '}
							<a href="https://www.gov.pl/web/rodzina/czas-pracy" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Ministerstwo Rodziny, Pracy i Polityki Społecznej</a>. Przy układaniu zmian należy też uwzględniać odpoczynek dobowy opisany przez{' '}
							<a href="https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/czy-wyjscie-prywatne-jest-jednoczesnie-odpoczynkiem" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Państwową Inspekcję Pracy</a>. W razie wątpliwości grafik powinien zweryfikować specjalista kadrowy.
						</p>
					</section>

					<section className="mb-10 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 md:p-7" aria-labelledby="planopia-gastronomy-workflow">
						<h2 id="planopia-gastronomy-workflow" className="text-2xl font-bold text-gray-900 mb-4">Jak Planopia wspiera ten proces?</h2>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							<li>grafik pracowników restauracji, kawiarni, baru lub cateringu,</li>
							<li>urlopy, inne nieobecności i ich akceptację,</li>
							<li>ewidencję godzin, nadgodzin oraz raporty PDF i Excel,</li>
							<li>opcjonalny timer i QR do rejestracji czasu z telefonu,</li>
							<li>tablice zadań i czat do codziennej organizacji lokalu,</li>
							<li>pracowników z własnym kontem oraz osoby bez dostępu do aplikacji.</li>
						</ul>
						<p className="text-gray-700 mt-4 mb-0">
							Zobacz pełny opis rozwiązania:{' '}
							<Link href="/dla-gastronomii" className="text-blue-600 font-semibold hover:underline">Planopia dla gastronomii</Link>.
						</p>
					</section>

					<section className="mb-10" aria-labelledby="restaurant-schedule-errors">
						<h2 id="restaurant-schedule-errors" className="text-2xl font-bold text-gray-900 mb-4">Najczęstsze błędy przy planowaniu zmian</h2>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							<li>kopiowanie poprzedniego tygodnia bez sprawdzenia rezerwacji i sezonowości,</li>
							<li>planowanie liczby osób bez uwzględnienia ról i kompetencji,</li>
							<li>przechowywanie próśb o wolne wyłącznie w prywatnych wiadomościach,</li>
							<li>publikowanie kilku równoległych wersji grafiku,</li>
							<li>brak porównania harmonogramu z rzeczywistą ewidencją godzin.</li>
						</ul>
					</section>

					<LandingAppScreenshotGallery locale="pl" title="Planopia w praktyce — grafik, urlopy i ewidencja" images={LANDING_APP_GALLERY_IMAGES} />

					<section className="mb-10" aria-labelledby="restaurant-schedule-faq">
						<h2 id="restaurant-schedule-faq" className="text-2xl font-bold text-gray-900 mb-5">Pytania o grafik pracy w restauracji</h2>
						<div className="space-y-4">
							{faqs.map(faq => (
								<div key={faq.q} className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 md:p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
									<p className="text-gray-700 m-0 leading-relaxed">{faq.a}</p>
								</div>
							))}
						</div>
					</section>

					<section className="mb-10 text-center bg-gradient-to-r from-blue-50 to-green-50 p-6 sm:p-9 rounded-xl shadow-sm" aria-labelledby="restaurant-article-cta">
						<h2 id="restaurant-article-cta" className="industry-cta-heading w-full text-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">Przygotuj pierwszy grafik zespołu w jednym systemie</h2>
						<p className="text-gray-700 mb-6 max-w-3xl mx-auto">30 dni pełnej aplikacji; potem darmowa ewidencja do 5 aktywnych kont lub plan z grafikami, urlopami, zadaniami i komunikacją.</p>
						<a href={registerHref} className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition white-text-btn text-center">Załóż zespół — 30 dni gratis</a>
					</section>

					<BlogRelatedLinks slug="jak-ulozyc-grafik-pracy-w-restauracji" locale="pl" className="mt-10" />
					<BlogArticleCredibility
						author="Michał Lipka"
						authorHref="/o-autorze"
						updatedOn={{ iso: '2026-07-17', label: '17 lipca 2026 r.' }}
					/>
				</article>
			</main>
		</>
	)
}
