'use client'

import { useState } from 'react'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import HamburgerButton from './HamburgerButton'
import LandingIndustriesDropdown from './LandingIndustriesDropdown'
import LandingSolutionsDropdown from './LandingSolutionsDropdown'
import {
	industryMobileConfig,
	landingMobileNavItemsPl,
	MOBILE_INDUSTRY_INSERT_INDEX,
} from '../data/landingNav'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogAiAssistantHeroVideo from './BlogAiAssistantHeroVideo'
import BlogArticleCredibility from './BlogArticleCredibility'

const PAGE_URL = 'https://planopia.pl/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik'
const ARTICLE_IMAGE = 'https://planopia.pl/img/aiass.webp'

const faqItems = [
	{
		q: 'Czy Asystent AI w Planopii zastępuje dział HR lub księgowość?',
		a: 'Nie. To narzędzie wspierające pracę na danych z aplikacji — podsumowania, orientacja w kontekście zespołu, szybsze odpowiedzi na typowe pytania. Decyzje formalne, interpretacje przepisów i polityka firmy pozostają po stronie ludzi.',
	},
	{
		q: 'Dlaczego AI ma sens dopiero przy połączonych modułach?',
		a: 'Gdy ewidencja czasu, urlopy, zadania i grafik żyją w jednym systemie, model może odnieść się do spójnych informacji zamiast do rozproszonych arkuszy i wątków mailowych. To ogranicza „halucynacje” i poprawia użyteczność podpowiedzi.',
	},
	{
		q: 'Czy są limity korzystania z Asystenta AI?',
		a: 'Tak — limity zależą od pakietu i etapu (np. okres próbny vs. aktywny plan płatny). Aktualne zasady znajdziesz w sekcji cennika na stronie głównej.',
	},
	{
		q: 'Czy Planopia automatyzuje całą ścieżkę wniosku urlopowego?',
		a: 'W aplikacji możesz prowadzić wnioski, akceptacje i kalendarz urlopów w sposób uporządkowany — to realna automatyzacja procesu w sensie organizacyjnym. Asystent AI dodatkowo pomaga w orientacji i podsumowaniach; szczegóły funkcji zależą od wybranego planu.',
	},
	{
		q: 'Jak zacząć korzystanie z Planopii z Asystentem AI?',
		a: 'Załóż zespół w aplikacji, zaproś użytkowników i skonfiguruj role. Po zalogowaniu sprawdź moduły czasu pracy, urlopów, zadań i grafiku — Asystent AI korzysta z kontekstu Twojej organizacji w ramach uprawnień.',
	},
	{
		q: 'Gdzie obejrzeć działanie aplikacji krok po kroku?',
		a: 'Na blogu dostępna jest instrukcja wideo z krótkimi nagraniami z interfejsu — link znajdziesz w treści artykułu lub w sekcji Blog.',
	},
]

function BlogAiAssistant() {
	const [menuOpen, setMenuOpen] = useState(false)
	const toggleMenu = () => setMenuOpen(prev => !prev)

	const articleLd = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline:
			'Asystent AI w Planopii: od ewidencji czasu i urlopów po zadania i grafik — jeden system zamiast pięciu narzędzi',
		url: PAGE_URL,
		datePublished: '2026-03-27',
		dateModified: '2026-03-27',
		author: { '@type': 'Person', name: 'Michał Lipka' },
		publisher: {
			'@type': 'Organization',
			name: 'Planopia',
			logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		},
		description:
			'Asystent AI w Planopii łączy kontekst ewidencji czasu pracy, urlopów, zadań i grafiku. Automatyzacja pracy zespołu i procesów HR w jednej aplikacji — bez rozproszenia danych między Excel i maile.',
		image: ARTICLE_IMAGE,
	}

	const faqLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a },
		})),
	}

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

			<header className="bg-white top-0 z-50 w-full flex justify-between" id="planopiaheader">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 menucontent" style={{ maxWidth: '1350px' }}>
					<Link href="/" className="logoinmenu text-2xl font-bold text-blue-700 companyname" style={{ marginBottom: '0px' }}>
						<img src="/img/new-logoplanopia.webp" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }} />
					</Link>
					<nav className="hidden desktop:flex space-x-8 navdesktop">
						<Link href="/#oaplikacji" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							O Aplikacji
						</Link>
						<Link href="/#asystent-ai" className="cursor-pointer text-blue-600 font-medium hover:text-indigo-600 transition">
							Asystent AI
						</Link>
						<Link href="/#cennik" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
							Cennik
						</Link>
						<LandingSolutionsDropdown locale="pl" />
						<LandingIndustriesDropdown locale="pl" />
						<Link href="/blog" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition" onClick={toggleMenu}>
							Blog
						</Link>
						<Link href="/#kontakt" className="cursor-pointer text-blue-600 font-medium hover:text-blue-700 transition">
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
						<Link href="/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules" className="flex items-center languagechoose">
							<img src="/img/united-kingdom.webp" alt="English version" className="w-6 h-6" />
						</Link>
					</nav>
					<HamburgerButton isOpen={menuOpen} onClick={toggleMenu} />
				</div>
			</header>

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
					href: '/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules',
					flagSrc: '/img/united-kingdom.webp',
					alt: 'English version',
				}}
			/>

			<section
				className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-emerald-50/30 landing-hero-below-fixed-header"
				id="blog-ai-assistant-welcome"
			>
				<div className="max-w-4xl md:max-w-5xl xl:max-w-6xl mx-auto w-full">
					<div className="rounded-2xl md:rounded-3xl border border-indigo-100/90 bg-white shadow-md md:shadow-lg px-6 py-9 sm:px-10 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 text-left md:text-center ring-1 ring-slate-200/60">
						<h1 className="font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 blogh1 leading-[1.2] tracking-tight max-w-5xl md:mx-auto">
							Asystent AI w Planopii: od ewidencji czasu i urlopów po zadania i grafik — jeden system zamiast pięciu narzędzi
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl md:max-w-4xl mx-0 md:mx-auto mb-6 sm:mb-8 md:mb-10 leading-snug sm:leading-relaxed">
							Planopia to nie tylko ewidencja — to spójny ekosystem: czas pracy, wnioski urlopowe i kalendarz, tablice zadań, grafik i komunikacja.
							<strong className="font-semibold text-gray-800"> Asystent AI</strong> działa tam, gdzie dane już są: podpowiada, streszcza i przyspiesza orientację — w ramach limitów pakietu. Okres próbny i plany:{' '}
							<Link href="/#cennik" className="text-blue-600 font-medium hover:underline whitespace-nowrap">
								cennik
							</Link>
							.
						</p>
						<Link
							href="https://app.planopia.pl/team-registration"
							className="inline-block bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:bg-green-700 transition text-base sm:text-lg white-text-btn"
						>
							Załóż darmowy zespół
						</Link>
					</div>
					<BlogAiAssistantHeroVideo locale="pl" />
				</div>
			</section>

			<article className="px-4 py-16 bg-white">
				<div className="max-w-4xl mx-auto">
					<p className="text-lg text-gray-700 mb-10 leading-relaxed">
						Firmy szukające <strong>automatyzacji pracy zespołu</strong> i prostszego <strong>HR</strong> często kończą z kilkoma narzędziami naraz:
						arkusz do godzin, inny do urlopów, tablica karteczek do zadań, e-mail do potwierdzeń. Ten artykuł pokazuje, jak{' '}
						<strong>aplikacja z AI do ewidencji czasu pracy</strong> — gdy jest zintegrowana z urlopami, zadaniami i grafikiem — realnie zmniejsza tarcie codziennej pracy, bez obiecywania „magii” ani zastępowania ludzkiej decyzji.
					</p>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Dlaczego AI „dopiero ma sens”, gdy moduły są połączone?
						</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Modele językowe najlepiej wspierają pracę wtedy, gdy mają dostęp do spójnego kontekstu. Gdy <strong>ewidencja czasu pracy i urlopy</strong> siedzą w jednym systemie razem z <strong>zadania</strong> w zespole i <strong>grafikiem</strong> lub planem zmian, użytkownik nie musi wklejać do czatu wycinków z pięciu źródeł — aplikacja już wie, kto jest na zmianie, kto ma wniosek urlopowy i co wisiało na tablicy.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							To prosta idea <strong>automatyzacji procesów HR</strong> i operacyjnych: jedna baza prawdy zamiast wersji „wersja końcowa_2_FINAL.xlsx”. Mniej ręcznego przepisywania, mniej pytań „kto ma dziś pierwszą zmianę?” rozstrzyganych przez łańcuch maili.
						</p>
						<div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
							<p className="text-indigo-900 font-semibold mb-2">Krótko: jeden system zamiast pięciu narzędzi</p>
							<p className="text-indigo-950/90">
								Planopia łączy te obszary w jednym interfejsie — stąd sensowne podsumowania i pytania do Asystenta w kontekście Twojej organizacji, a nie ogólne porady z internetu.
							</p>
						</div>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Co robi Asystent AI w Planopii?</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Asystent nie jest od rozstrzygania sporów prawnych ani od zastępowania regulaminu pracy. Jest od tego, by — na bazie danych i uprawnień w aplikacji — pomóc w <strong>podsumowaniach</strong>, szybkiej orientacji i typowych pytaniach użytkownika: co dziś wymaga uwagi, jak wygląda obłożenie, jakie są proste zależności między wpisami.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							W praktyce oznacza to mniej czasu na szukanie informacji w menu i więcej na realną pracę menedżerską. To podejście do <strong>Planopia Asystent AI</strong> stoi bliżej wsparcia operacyjnego niż „czatu z internetem” — bo kotwica jest w Twoim zespole.
						</p>
						<ul className="list-disc pl-6 text-lg text-gray-700 space-y-2 mb-4">
							<li>orientacja w sytuacji zespołu: kalendarz, nieobecności, aktywne zadania;</li>
							<li>krótkie streszczenia i wyjaśnienia w języku naturalnym — z uwzględnieniem limitów i polityki produktu;</li>
							<li>spójność z modułami: czas pracy, urlopy, zadania, grafik — zależnie od pakietu.</li>
						</ul>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Urlopy i ewidencja — mniej błędów, szybsza orientacja</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							<strong>Kalendarz urlopów online</strong> w jednym systemie z ewidencją oznacza, że widzisz nie tylko „kto napisał w mailu”, ale kto realnie ma wprowadzony wniosek i status. To fundament pod <strong>automatyzację wniosków urlopowych i ewidencji</strong> w sensie organizacyjnym: przepływ jest zamknięty w aplikacji, a nie rozrzucony.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Dla pracownika to przejrzystość: gdzie jest mój wniosek, co zostało do zatwierdzenia. Dla zespołu — mniej konfliktów terminów i szybsza odpowiedź na pytanie „kiedy mogę zaplanować wdrożenie”, gdy widać urlopy obok grafiku.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Zadania i grafik — priorytety i obłożenie zespołu</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							<strong>Zarządzanie zadaniami w zespole</strong> na tablicy (np. w stylu Kanban) oraz <strong>grafik pracy</strong> lub plan zmian dają obraz: kto realnie może wziąć temat, a kiedy zespół jest cienki przez urlopy lub sezonowy peak.{' '}
							<strong>Czy AI może pomóc w planowaniu grafiku?</strong> — może wspierać orientację i syntezę informacji z już wprowadzonych danych; decyzje kadrowe i organizacyjne pozostają po stronie ludzi i polityki firmy.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							W połączeniu z Asystentem łatwiej zobaczyć „co pilne” obok „kto dostępny” — bez zastępowania menedżera, ale z mniejszym narzutem na ręczne zestawianie tabel.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Automatyzacja w firmie bez rozpraszania danych</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							<strong>Automatyzacja pracy zespołu</strong> zaczyna się często od porządku: wspólne miejsce na czas, nieobecności i zadania. Dopiero potem sensowne są integracje i inteligentne podpowiedzi. Planopia adresuje też <strong>narzędzie HR dla małej firmy</strong>: prosty start, role, skalowanie w górę gdy przybywa ludzi i modułów.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Zamiast pytania „jak połączyć ewidencję czasu pracy z urlopami i zadaniami?” rozstrzygniętego przez import CSV na ślepo — dostajesz jeden przepływ w jednej aplikacji. To obniża koszt utrzymania i szkolenia zespołu w porównaniu z zestawem rozłącznych narzędzi.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Bezpieczeństwo, role i limity</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Dostęp do danych jest podzielony rolami i uprawnieniami — Asystent AI nie „obejdzie” polityki widoczności ustawionej w aplikacji. <strong>Limity Asystenta AI</strong> zależą od wybranego planu i etapu subskrypcji; dokładne warunki znajdziesz w{' '}
							<Link href="/#cennik" className="text-blue-600 font-medium hover:underline">
								cenniku
							</Link>
							.
						</p>
						<p className="text-lg text-gray-700 leading-relaxed">
							Traktuj Asystenta jako warstwę pomocy na danych, które już świadomie wprowadzasz do systemu — zgodnie z RODO, dobrymi praktykami i wewnętrznymi procedurami Twojej organizacji.
						</p>
					</section>

					<section className="mb-14">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Jak zacząć i gdzie obejrzeć interfejs</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Zarejestruj zespół (okres próbny i plany opisane są na stronie produktu), zaproś użytkowników i skonfiguruj moduły zgodnie z potrzebami. Jeśli wolisz format wideo, zajrzyj do{' '}
							<Link href="/jak-korzystac" className="text-blue-600 font-medium hover:underline">
								instrukcji wideo Planopii
							</Link>{' '}
							— krótkie nagrania z aplikacji ułatwiają start bez czytania długiej dokumentacji.
						</p>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Porównanie modelu „próba → darmowa ewidencja → pakiety” znajdziesz też w artykule{' '}
							<Link href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy" className="text-blue-600 font-medium hover:underline">
								o darmowej aplikacji do ewidencji czasu pracy
							</Link>
							.
						</p>
						<div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-6 text-center">
							<p className="text-lg text-emerald-900 font-semibold mb-3">Gotowy przetestować Planopię?</p>
							<Link
								href="https://app.planopia.pl/team-registration"
								className="inline-block bg-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow hover:bg-green-700 transition white-text-btn"
							>
								Załóż darmowy zespół
							</Link>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">Często zadawane pytania</h2>
						<div className="space-y-6">
							{faqItems.map((item) => (
								<div key={item.q} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
									<h3 className="text-xl font-semibold text-gray-900 mb-2">{item.q}</h3>
									<p className="text-gray-700 leading-relaxed">{item.a}</p>
								</div>
							))}
						</div>
					</section>

					<BlogRelatedLinks slug="asystent-ai-planopia-ewidencja-urlopy-zadania-grafik" className="mt-10" />
					<BlogArticleCredibility
						author="Michał Lipka"
						authorHref="/o-autorze"
						updatedOn={{ iso: '2026-03-27', label: '27 marca 2026 r.' }}
					/>
				</div>
			</article>

		</>
	)
}

export default BlogAiAssistant
