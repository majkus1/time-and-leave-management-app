import Link from 'next/link'
import BlogRelatedLinks from './BlogRelatedLinks'
import LandingAppScreenshotGallery from './LandingAppScreenshotGallery'
import { LANDING_APP_GALLERY_IMAGES } from '@/data/landingAppGallery'

const canonical = 'https://planopia.pl/blog/jak-zarzadzac-firma-sprzatajaca'
const registerHref = 'https://app.planopia.pl/team-registration'

const faqs = [
	{
		q: 'Jak skutecznie zarządzać pracownikami w firmie sprzątającej?',
		a: 'Ustal jeden standard przekazywania grafiku, zakresu pracy i zmian. Trzymaj w jednym miejscu harmonogram, urlopy, zadania oraz rzeczywiste godziny, a odpowiedzialność za każdy obiekt i zgłoszenie przypisuj konkretnym osobom.',
	},
	{
		q: 'Jak ułożyć grafik ekip sprzątających dla wielu obiektów?',
		a: 'Najpierw opisz wymagania każdego obiektu: dni, godziny, minimalną obsadę i potrzebne kompetencje. Następnie przypisz zespoły, sprawdź urlopy i możliwe kolizje oraz opublikuj jedną obowiązującą wersję harmonogramu.',
	},
	{
		q: 'Czy firma sprzątająca może prowadzić ewidencję czasu online?',
		a: 'Tak. Ewidencja może być prowadzona elektronicznie. System online ułatwia zebranie godzin, nieobecności i raportów, ale sposób prowadzenia dokumentacji powinien odpowiadać formom zatrudnienia i zasadom obowiązującym w firmie.',
	},
	{
		q: 'Czy Planopia monitoruje lokalizację pracowników?',
		a: 'Nie. Planopia nie śledzi GPS ani nie wykorzystuje NFC. Łączy grafik, ewidencję czasu, urlopy, zadania i komunikację, pomagając koordynować pracę bez ciągłego monitorowania położenia zespołu.',
	},
] as const

const steps = [
	{
		title: 'Opisz obiekty i standard wykonania usługi',
		body: 'Dla każdego miejsca określ adres, dni i godziny pracy, zakres czynności, częstotliwość, osobę kontaktową oraz wymagania dotyczące dostępu. Dzięki temu koordynator nie musi za każdym razem odtwarzać ustaleń z wiadomości.',
	},
	{
		title: 'Zbuduj zespoły i przypisz odpowiedzialność',
		body: 'Ustal, kto odpowiada za obiekt, kto może zastąpić lidera oraz jakie kompetencje są potrzebne. Sama lista nazwisk nie wystarczy, gdy część osób obsługuje specjalistyczny sprzęt albo pracuje tylko w określonych godzinach.',
	},
	{
		title: 'Przygotuj jeden aktualny grafik ekip',
		body: 'Zaplanuj zmiany, uwzględniając urlopy, nieobecności, czas dojazdu i możliwe nakładanie się zleceń. Pracownicy powinni wiedzieć, gdzie sprawdzić obowiązującą wersję, bez szukania ostatniego zdjęcia arkusza w rozmowie.',
	},
	{
		title: 'Przekazuj zakres pracy jako konkretne zadania',
		body: 'Zamiast ogólnego „posprzątać obiekt”, rozpisz zadania cykliczne, dodatkowe oraz zgłoszenia wymagające reakcji. Jasna odpowiedzialność ułatwia kontrolę wykonania i ogranicza spory o to, kto miał zająć się daną czynnością.',
	},
	{
		title: 'Przygotuj procedurę zastępstw',
		body: 'Określ, kto przyjmuje informację o nieobecności, gdzie aktualizowany jest grafik i jak przekazywane są szczegóły obiektu osobie zastępującej. Proces powinien działać również wtedy, gdy zmiana następuje tuż przed rozpoczęciem pracy.',
	},
	{
		title: 'Zbieraj rzeczywiste godziny i sprawdzaj rozbieżności',
		body: 'Porównuj plan z wykonaniem: brakujące wpisy, nadgodziny, nieobecności i różnice wymagające wyjaśnienia. Regularna kontrola jest prostsza niż odtwarzanie całego miesiąca tuż przed przekazaniem danych do księgowości.',
	},
	{
		title: 'Mierz proces, nie tylko obecność',
		body: 'Analizuj powtarzające się zastępstwa, braki w ewidencji, przeciążenie konkretnych osób i zadania wracające jako poprawki. Takie dane pomagają usprawniać organizację bez sprowadzania zarządzania wyłącznie do kontroli pracownika.',
	},
] as const

export default function BlogCleaningCompanyManagementArticle() {
	const blogPostingSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: 'Jak zarządzać firmą sprzątającą? Praktyczny poradnik',
		description: 'Organizacja obiektów, grafik ekip, zastępstwa, zadania i ewidencja godzin w firmie sprzątającej — proces krok po kroku.',
		image: ['https://planopia.pl/img/sprzatajaca.webp'],
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.png' },
		},
		url: canonical,
		datePublished: '2026-07-17',
		dateModified: '2026-07-17',
		inLanguage: 'pl-PL',
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
		keywords: 'jak zarządzać firmą sprzątającą, grafik pracy firma sprzątająca, zarządzanie ekipą sprzątającą, ewidencja czasu pracy',
	}

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Planopia', item: 'https://planopia.pl' },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://planopia.pl/blog' },
			{ '@type': 'ListItem', position: 3, name: 'Zarządzanie firmą sprzątającą', item: canonical },
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
						<p className="text-sm font-semibold text-sky-700 mb-3">Zarządzanie firmą sprzątającą · praca zespołu</p>
						<h1 className="construction-industry-h1 text-gray-900 mb-4 leading-tight">Jak zarządzać firmą sprzątającą? Praktyczny poradnik</h1>
						<p className="text-gray-600 text-lg leading-relaxed">
							Dobra organizacja firmy sprzątającej musi połączyć wiele obiektów, rozproszonych pracowników, zmiany godzin, zastępstwa i kontrolę wykonania. Poniżej znajdziesz proces, który pomaga uporządkować operacje bez mnożenia arkuszy i grup wiadomości.
						</p>
					</header>

					<section className="mb-10 rounded-xl border border-sky-200 bg-sky-50/60 p-5 md:p-7" aria-labelledby="cleaning-management-goal">
						<h2 id="cleaning-management-goal" className="text-2xl font-bold text-gray-900 mb-3">Co powinien widzieć koordynator firmy sprzątającej?</h2>
						<p className="text-gray-700 mb-4">Bez przeszukiwania wiadomości powinien móc odpowiedzieć:</p>
						<ul className="list-disc pl-5 space-y-2 text-gray-700 m-0">
							<li>która ekipa i o której godzinie obsługuje dany obiekt,</li>
							<li>kto odpowiada za zmianę i kto może przejąć zastępstwo,</li>
							<li>jaki zakres pracy oraz zadania dodatkowe są do wykonania,</li>
							<li>kto ma urlop lub zgłoszoną nieobecność,</li>
							<li>czy ewidencja godzin jest kompletna przed końcem miesiąca.</li>
						</ul>
					</section>

					<section className="mb-10" aria-labelledby="cleaning-management-steps">
						<h2 id="cleaning-management-steps" className="text-2xl font-bold text-gray-900 mb-5">Jak zarządzać firmą sprzątającą krok po kroku</h2>
						<ol className="list-none space-y-4 m-0 p-0">
							{steps.map((step, index) => (
								<li key={step.title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 md:p-6">
									<div className="flex gap-4">
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-700 text-sm font-bold !text-white" aria-hidden>{index + 1}</span>
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
											<p className="text-gray-700 m-0 leading-relaxed">{step.body}</p>
										</div>
									</div>
								</li>
							))}
						</ol>
					</section>

					<section className="mb-10" aria-labelledby="cleaning-timesheet-law">
						<h2 id="cleaning-timesheet-law" className="text-2xl font-bold text-gray-900 mb-4">Lista obecności a ewidencja czasu pracy</h2>
						<p className="text-gray-700 mb-4 leading-relaxed">
							Potwierdzenie obecności na obiekcie nie zastępuje pełnej ewidencji czasu pracy. Państwowa Inspekcja Pracy wyjaśnia różnicę między tymi dokumentami oraz zakres informacji potrzebnych do prawidłowego ustalenia wynagrodzenia.
						</p>
						<p className="text-gray-700 leading-relaxed">
							Sprawdź oficjalne materiały: <a href="https://www.pip.gov.pl/dla-pracodawcow/pytania-i-odpowiedzi/jaka-jest-roznica-miedzy-ewidencja-czasu-pracy-a-lista-obecnosci" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">PIP — ewidencja a lista obecności</a> oraz <a href="https://www.gov.pl/web/rodzina/rozliczanie-czasu-pracy" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">gov.pl — rozliczanie czasu pracy</a>. Wątpliwości dotyczące konkretnej firmy warto skonsultować ze specjalistą kadrowym.
						</p>
					</section>

					<section className="mb-10 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 md:p-7" aria-labelledby="planopia-cleaning-workflow">
						<h2 id="planopia-cleaning-workflow" className="text-2xl font-bold text-gray-900 mb-4">Jak Planopia wspiera organizację firmy sprzątającej?</h2>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							<li>grafik pracy koordynatorów i ekip sprzątających,</li>
							<li>urlopy, inne nieobecności i proces decyzji,</li>
							<li>ewidencję godzin, nadgodzin oraz raporty PDF i Excel,</li>
							<li>opcjonalny Timer + QR do rejestracji czasu z telefonu,</li>
							<li>tablice zadań, komunikaty i czat do przekazywania ustaleń,</li>
							<li>pracowników z kontem oraz osoby bez dostępu do aplikacji.</li>
						</ul>
						<p className="text-gray-700 mt-4 mb-0">
							Zobacz rozwiązanie: <Link href="/dla-firm-sprzatajacych" className="text-blue-600 font-semibold hover:underline">Planopia dla firm sprzątających</Link>.
						</p>
					</section>

					<section className="mb-10" aria-labelledby="cleaning-management-errors">
						<h2 id="cleaning-management-errors" className="text-2xl font-bold text-gray-900 mb-4">Najczęstsze błędy w organizacji ekip sprzątających</h2>
						<ul className="list-disc pl-5 space-y-2 text-gray-700">
							<li>brak jednej obowiązującej wersji grafiku,</li>
							<li>przechowywanie szczegółów obiektów wyłącznie w prywatnych wiadomościach,</li>
							<li>brak procedury nagłych zastępstw i przekazania dostępu,</li>
							<li>ogólne zadania bez właściciela i terminu,</li>
							<li>sprawdzanie braków w godzinach dopiero przy rozliczeniu miesiąca,</li>
							<li>mylenie kontroli obecności z oceną jakości wykonanej usługi.</li>
						</ul>
					</section>

					<LandingAppScreenshotGallery locale="pl" title="Planopia w praktyce — grafik, zadania i ewidencja" images={LANDING_APP_GALLERY_IMAGES} />

					<section className="mb-10" aria-labelledby="cleaning-management-faq">
						<h2 id="cleaning-management-faq" className="text-2xl font-bold text-gray-900 mb-5">Pytania o zarządzanie firmą sprzątającą</h2>
						<div className="space-y-4">
							{faqs.map(faq => (
								<div key={faq.q} className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 md:p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
									<p className="text-gray-700 m-0 leading-relaxed">{faq.a}</p>
								</div>
							))}
						</div>
					</section>

					<section className="mb-10 text-center bg-gradient-to-r from-blue-50 to-green-50 p-6 sm:p-9 rounded-xl shadow-sm" aria-labelledby="cleaning-article-cta">
						<h2 id="cleaning-article-cta" className="industry-cta-heading w-full text-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">Uporządkuj grafik, godziny i zadania ekip</h2>
						<p className="text-gray-700 mb-6 max-w-3xl mx-auto">30 dni pełnej aplikacji; potem darmowa ewidencja do 5 aktywnych kont lub plan z grafikami, urlopami, zadaniami i komunikacją.</p>
						<a href={registerHref} className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition white-text-btn text-center">Załóż zespół — 30 dni gratis</a>
					</section>

					<BlogRelatedLinks slug="jak-zarzadzac-firma-sprzatajaca" locale="pl" className="mt-10" />
				</article>
			</main>
		</>
	)
}
