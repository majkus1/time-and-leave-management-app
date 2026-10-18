import Image from 'next/image'
import Link from 'next/link'
import BlogArticleShell, { ArticleCta, ArticleNote } from './blogArticle/BlogArticleShell'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'
import { shot } from '@/data/productShots'
import { LANDING_TRIAL_DAYS, landingCoreTiers, landingTrial } from '@/data/landingPlanPricing'

const PAGE_URL = 'https://planopia.pl/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik'
const ARTICLE_IMAGE = 'https://planopia.pl/img/aiass.webp'
const REGISTER = 'https://app.planopia.pl/team-registration'

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
		q: 'Czy Asystent AI ma limit wiadomości?',
		a: 'Nie. W okresie próbnym i w każdym planie płatnym (Core, PRO, Business) korzystasz bez liczników i bez dokupywania pakietów. Obowiązuje tylko rozsądne użycie, które chroni przed nadużyciami. Co obejmuje który plan, znajdziesz w cenniku na stronie głównej.',
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
		q: 'Gdzie znajdę instrukcję obsługi krok po kroku?',
		a: 'Na stronie „Jak korzystać” jest instrukcja obsługi krok po kroku — opis każdego modułu, od ewidencji czasu pracy po grafiki i urlopy. Link znajdziesz w treści artykułu.',
	},
]

/**
 * /blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik — treść bez zmian, oprawa jak strony produktowe
 * (BlogArticleShell). Film z autoodtwarzaniem w hero zastąpił jego plakat (ten sam obraz co image w JSON-LD),
 * żeby strona nie odtwarzała niczego sama.
 */
function BlogAiAssistant() {
	const dashboard = shot('pl', 'dashboard')
	const scheduleAuto = shot('pl', 'schedule-auto')

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

			<BlogArticleShell
				crumb={{ label: 'Planopia i instrukcje', href: '/blog' }}
				pill="Asystent AI"
				h1="Asystent AI w Planopii: od ewidencji czasu i urlopów po zadania i grafik — jeden system zamiast pięciu narzędzi"
				lead={
					<p>
						Planopia to nie tylko ewidencja — to spójny ekosystem: czas pracy, wnioski urlopowe i kalendarz, tablice zadań, grafik i komunikacja.
						<strong> Asystent AI</strong> działa tam, gdzie dane już są: podpowiada, streszcza i przyspiesza orientację — w każdym planie płatnym bez limitu wiadomości. Okres próbny i plany:{' '}
						<Link href="/#cennik">cennik</Link>
						.
					</p>
				}
				primary={{ href: REGISTER, label: 'Załóż darmowy zespół' }}
				secondary={{ href: '/#cennik', label: 'Zobacz cennik' }}
				meta={{ iso: '2026-03-27', label: 'Zaktualizowano 27 marca 2026 r. · Michał Lipka' }}
				image={{ src: '/img/aiass.webp', alt: 'Planopia — Asystent AI, podsumowania i kontekst z aplikacji', width: 1900, height: 911 }}
				toc={[
					{ id: 'dlaczego-polaczone-moduly', label: 'Dlaczego AI ma sens przy połączonych modułach?' },
					{ id: 'co-robi-asystent', label: 'Co robi Asystent AI w Planopii?' },
					{ id: 'urlopy-i-ewidencja', label: 'Urlopy i ewidencja' },
					{ id: 'zadania-i-grafik', label: 'Zadania i grafik' },
					{ id: 'automatyzacja', label: 'Automatyzacja bez rozpraszania danych' },
					{ id: 'bezpieczenstwo', label: 'Bezpieczeństwo i role' },
					{ id: 'jak-zaczac', label: 'Jak zacząć i gdzie znaleźć instrukcję' },
					{ id: 'faq', label: 'Często zadawane pytania' },
				]}
				cta={{
					title: 'Sprawdź Asystenta AI na danych swojego zespołu',
					note: `${LANDING_TRIAL_DAYS} dni pełnej aplikacji z Asystentem AI za darmo, do ${landingTrial.maxUsers} osób, bez karty. Potem plan Core od ${landingCoreTiers[0].monthlyNetPln} zł netto miesięcznie — Asystent AI jest w nim bez limitu wiadomości.`,
					primary: { href: REGISTER, label: 'Załóż darmowy zespół' },
				}}
			>
				<p>
					Firmy szukające <strong>automatyzacji pracy zespołu</strong> i prostszego <strong>HR</strong> często kończą z kilkoma narzędziami naraz:
					arkusz do godzin, inny do urlopów, tablica karteczek do zadań, e-mail do potwierdzeń. Ten artykuł pokazuje, jak{' '}
					<strong>aplikacja z AI do ewidencji czasu pracy</strong> — gdy jest zintegrowana z urlopami, zadaniami i grafikiem — realnie zmniejsza tarcie codziennej pracy, bez obiecywania „magii” ani zastępowania ludzkiej decyzji.
				</p>

				<h2 id="dlaczego-polaczone-moduly">Dlaczego AI „dopiero ma sens”, gdy moduły są połączone?</h2>
				<p>
					Modele językowe najlepiej wspierają pracę wtedy, gdy mają dostęp do spójnego kontekstu. Gdy <strong>ewidencja czasu pracy i urlopy</strong> siedzą w jednym systemie razem z <strong>zadania</strong> w zespole i <strong>grafikiem</strong> lub planem zmian, użytkownik nie musi wklejać do czatu wycinków z pięciu źródeł — aplikacja już wie, kto jest na zmianie, kto ma wniosek urlopowy i co wisiało na tablicy.
				</p>
				<p>
					To prosta idea <strong>automatyzacji procesów HR</strong> i operacyjnych: jedna baza prawdy zamiast wersji „wersja końcowa_2_FINAL.xlsx”. Mniej ręcznego przepisywania, mniej pytań „kto ma dziś pierwszą zmianę?” rozstrzyganych przez łańcuch maili.
				</p>
				<ArticleNote tone="mint">
					<p>
						<strong>Krótko: jeden system zamiast pięciu narzędzi</strong>
					</p>
					<p>
						Planopia łączy te obszary w jednym interfejsie — stąd sensowne podsumowania i pytania do Asystenta w kontekście Twojej organizacji, a nie ogólne porady z internetu.
					</p>
				</ArticleNote>

				<h2 id="co-robi-asystent">Co robi Asystent AI w Planopii?</h2>
				<p>
					Asystent nie jest od rozstrzygania sporów prawnych ani od zastępowania regulaminu pracy. Jest od tego, by — na bazie danych i uprawnień w aplikacji — pomóc w <strong>podsumowaniach</strong>, szybkiej orientacji i typowych pytaniach użytkownika: co dziś wymaga uwagi, jak wygląda obłożenie, jakie są proste zależności między wpisami.
				</p>
				<p>
					W praktyce oznacza to mniej czasu na szukanie informacji w menu i więcej na realną pracę menedżerską. To podejście do <strong>Planopia Asystent AI</strong> stoi bliżej wsparcia operacyjnego niż „czatu z internetem” — bo kotwica jest w Twoim zespole.
				</p>
				<ul>
					<li>orientacja w sytuacji zespołu: kalendarz, nieobecności, aktywne zadania;</li>
					<li>krótkie streszczenia i wyjaśnienia w języku naturalnym — z uwzględnieniem limitów i polityki produktu;</li>
					<li>spójność z modułami: czas pracy, urlopy, zadania, grafik — zależnie od pakietu.</li>
				</ul>
				<figure>
					<Image src={dashboard.src} alt={dashboard.alt} width={dashboard.width} height={dashboard.height} unoptimized />
					<figcaption>{dashboard.caption}</figcaption>
				</figure>

				<ArticleCta
					title="Asystent AI w okresie próbnym"
					text={`${LANDING_TRIAL_DAYS} dni pełnej aplikacji bez karty — z Asystentem AI bez limitu wiadomości. Potem Asystent jest w planie Core i wyższych, nie w planie darmowym.`}
					link={{ href: REGISTER, label: 'Wypróbuj za darmo' }}
				/>

				<h2 id="urlopy-i-ewidencja">Urlopy i ewidencja — mniej błędów, szybsza orientacja</h2>
				<p>
					<strong>Kalendarz urlopów online</strong> w jednym systemie z ewidencją oznacza, że widzisz nie tylko „kto napisał w mailu”, ale kto realnie ma wprowadzony wniosek i status. To fundament pod <strong>automatyzację wniosków urlopowych i ewidencji</strong> w sensie organizacyjnym: przepływ jest zamknięty w aplikacji, a nie rozrzucony.
				</p>
				<p>
					Dla pracownika to przejrzystość: gdzie jest mój wniosek, co zostało do zatwierdzenia. Dla zespołu — mniej konfliktów terminów i szybsza odpowiedź na pytanie „kiedy mogę zaplanować wdrożenie”, gdy widać urlopy obok grafiku.
				</p>

				<h2 id="zadania-i-grafik">Zadania i grafik — priorytety i obłożenie zespołu</h2>
				<p>
					<strong>Zarządzanie zadaniami w zespole</strong> na tablicy zadań oraz <strong>grafik pracy</strong> lub plan zmian dają obraz: kto realnie może wziąć temat, a kiedy zespół jest cienki przez urlopy lub sezonowy peak.{' '}
					<strong>Czy AI może pomóc w planowaniu grafiku?</strong> — może wspierać orientację i syntezę informacji z już wprowadzonych danych; decyzje kadrowe i organizacyjne pozostają po stronie ludzi i polityki firmy.
				</p>
				<p>
					W połączeniu z Asystentem łatwiej zobaczyć „co pilne” obok „kto dostępny” — bez zastępowania menedżera, ale z mniejszym narzutem na ręczne zestawianie tabel.
				</p>
				<figure>
					<Image src={scheduleAuto.src} alt={scheduleAuto.alt} width={scheduleAuto.width} height={scheduleAuto.height} unoptimized />
					<figcaption>{scheduleAuto.caption}</figcaption>
				</figure>

				<h2 id="automatyzacja">Automatyzacja w firmie bez rozpraszania danych</h2>
				<p>
					<strong>Automatyzacja pracy zespołu</strong> zaczyna się często od porządku: wspólne miejsce na czas, nieobecności i zadania. Dopiero potem sensowne są integracje i inteligentne podpowiedzi. Planopia adresuje też <strong>narzędzie HR dla małej firmy</strong>: prosty start, role, skalowanie w górę gdy przybywa ludzi i modułów.
				</p>
				<p>
					Zamiast pytania „jak połączyć ewidencję czasu pracy z urlopami i zadaniami?” rozstrzygniętego przez import CSV na ślepo — dostajesz jeden przepływ w jednej aplikacji. To obniża koszt utrzymania i szkolenia zespołu w porównaniu z zestawem rozłącznych narzędzi.
				</p>

				<h2 id="bezpieczenstwo">Bezpieczeństwo i role</h2>
				<p>
					Dostęp do danych jest podzielony rolami i uprawnieniami — Asystent AI nie „obejdzie” polityki widoczności ustawionej w aplikacji. W każdym planie płatnym <strong>Asystent AI nie ma limitu wiadomości</strong> (obowiązuje rozsądne użycie); co obejmuje który plan, znajdziesz w{' '}
					<Link href="/#cennik">cenniku</Link>
					.
				</p>
				<p>
					Traktuj Asystenta jako warstwę pomocy na danych, które już świadomie wprowadzasz do systemu — zgodnie z RODO, dobrymi praktykami i wewnętrznymi procedurami Twojej organizacji.
				</p>

				<h2 id="jak-zaczac">Jak zacząć i gdzie znaleźć instrukcję</h2>
				<p>
					Zarejestruj zespół (okres próbny i plany opisane są na stronie produktu), zaproś użytkowników i skonfiguruj moduły zgodnie z potrzebami. Krok po kroku prowadzi{' '}
					<Link href="/jak-korzystac">instrukcja obsługi Planopii</Link>{' '}
					— opis każdego modułu, od ewidencji czasu pracy po grafiki i urlopy.
				</p>
				<p>
					Porównanie modelu „próba → darmowa ewidencja → pakiety” znajdziesz też w artykule{' '}
					<Link href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy">o darmowej aplikacji do ewidencji czasu pracy</Link>
					.
				</p>
				<ArticleCta
					title="Gotowy przetestować Planopię?"
					text={`Załóż zespół i przez ${LANDING_TRIAL_DAYS} dni korzystaj z pełnej aplikacji, także z Asystenta AI — bez karty.`}
					link={{ href: REGISTER, label: 'Załóż darmowy zespół' }}
				/>

				<h2 id="faq">Często zadawane pytania</h2>
				{faqItems.map((item) => (
					<div key={item.q}>
						<h3>{item.q}</h3>
						<p>{item.a}</p>
					</div>
				))}

				<div className="bart-extras">
					<BlogRelatedLinks slug="asystent-ai-planopia-ewidencja-urlopy-zadania-grafik" className="mt-10" />
					<BlogArticleCredibility
						author="Michał Lipka"
						authorHref="/o-autorze"
						updatedOn={{ iso: '2026-03-27', label: '27 marca 2026 r.' }}
					/>
				</div>
			</BlogArticleShell>
		</>
	)
}

export default BlogAiAssistant
