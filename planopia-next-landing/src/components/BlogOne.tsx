import Image from 'next/image'
import Link from 'next/link'
import BlogArticleShell, { ArticleCta, ArticleNote } from './blogArticle/BlogArticleShell'
import BlogRelatedLinks from './BlogRelatedLinks'
import BlogArticleCredibility from './BlogArticleCredibility'
import { shot } from '@/data/productShots'
import { LANDING_TRIAL_DAYS, landingCoreTiers, landingTrial } from '@/data/landingPlanPricing'

const REGISTER = 'https://app.planopia.pl/team-registration'

/** /blog/ewidencja-czasu-pracy-online — treść bez zmian, oprawa jak strony produktowe (BlogArticleShell). */
function BlogOne() {
	const timeCalendar = shot('pl', 'time-calendar')
	const worktime = shot('pl', 'worktime')

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
						"description": "Ewidencja czasu pracy online — program i aplikacja z rejestracją godzin i raportami PDF/XLSX. 30 dni pełnej aplikacji za darmo (do 5 osób), potem darmowy plan ewidencji do 5 aktywnych kont lub pakiety płatne z urlopami i AI.",
						"image": "https://planopia.pl/img/desktopnews.webp",
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
						"url": "https://planopia.pl/blog/ewidencja-czasu-pracy-online",
						"datePublished": "2025-08-25",
						"dateModified": "2026-05-31"
					})
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'FAQPage',
						mainEntity: [
							{
								'@type': 'Question',
								name: 'Czym jest ewidencja czasu pracy online?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'To prowadzenie rejestracji godzin pracy i nadgodzin w aplikacji dostępnej z przeglądarki lub telefonu (np. jako PWA), zamiast wyłącznie w papierze lub rozproszonych plikach Excel.',
								},
							},
							{
								'@type': 'Question',
								name: 'Czy program do ewidencji czasu pracy online zastępuje Excel?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Tak — typowy program do ewidencji czasu pracy przenosi wpisy, raporty i eksport do PDF/XLSX do jednego systemu; Excel nadal możesz użyć jako format eksportu danych z aplikacji.',
								},
							},
							{
								'@type': 'Question',
								name: 'Czy Planopia oferuje darmową ewidencję czasu pracy?',
								acceptedAnswer: {
									'@type': 'Answer',
									text: 'Po 30 dniach pełnej aplikacji (do 5 użytkowników) możesz pozostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wykupić pakiet płatny z urlopami i pozostałymi modułami.',
								},
							},
						],
					}),
				}}
			/>

			<BlogArticleShell
				crumb={{ label: 'Ewidencja czasu pracy', href: '/blog#ewidencja' }}
				pill="Ewidencja online"
				h1="Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm"
				lead={
					<p>
						Prowadzenie dokładnej <strong>ewidencji czasu pracy</strong> to obowiązek każdej firmy. Tradycyjne metody,
						takie jak papierowe listy obecności czy Excel, często są nieefektywne i podatne na błędy.
						Dlatego coraz więcej przedsiębiorstw wybiera <strong>programy i aplikacje online</strong>,
						które automatyzują i porządkują ten proces.
					</p>
				}
				primary={{ href: REGISTER, label: 'Załóż darmowy zespół' }}
				secondary={{ href: '/#cennik', label: 'Zobacz cennik' }}
				note={
					<>
						<strong>Darmowa aplikacja do ewidencji czasu pracy</strong> — 30 dni pełnej aplikacji; potem bezpłatna ewidencja do 5 aktywnych kont
					</>
				}
				meta={{ iso: '2026-05-31', label: 'Zaktualizowano 31 maja 2026 r. · Michał Lipka' }}
				image={{ src: '/img/desktopnews.webp', alt: 'Ewidencja czasu pracy online w Planopii — widok na komputerze', width: 1918, height: 910 }}
				toc={[
					{ id: 'dlaczego-wazna', label: 'Dlaczego ewidencja jest ważna?' },
					{ id: 'problemy', label: 'Problemy z tradycyjną ewidencją' },
					{ id: 'excel', label: 'Excel a ewidencja online' },
					{ id: 'rejestracja-online', label: 'Rejestracja czasu pracy online' },
					{ id: 'program-funkcje', label: 'Co powinien mieć program?' },
					{ id: 'planopia', label: 'Planopia – aplikacja do ewidencji' },
					{ id: 'podsumowanie', label: 'Podsumowanie' },
					{ id: 'faq-ewidencja-online', label: 'Najczęstsze pytania' },
				]}
				cta={{
					title: 'Prowadź ewidencję czasu pracy online',
					note: `${LANDING_TRIAL_DAYS} dni pełnej aplikacji za darmo, do ${landingTrial.maxUsers} osób, bez karty. Potem darmowa ewidencja czasu pracy do ${landingTrial.maxUsers} kont albo plan Core z urlopami od ${landingCoreTiers[0].monthlyNetPln} zł netto miesięcznie.`,
					primary: { href: REGISTER, label: 'Załóż darmowy zespół' },
				}}
			>
				{/* Baner filaru był w hero nad przyciskami — zostaje na początku treści */}
				<BlogRelatedLinks
					slug="ewidencja-czasu-pracy-online"
					position="top"
					className="mt-6 md:mt-8"
				/>
				<p>
					<Link href="/program-do-ewidencji-czasu-pracy">Zobacz program do ewidencji czasu pracy →</Link>
				</p>

				<h2 id="dlaczego-wazna">Dlaczego ewidencja czasu pracy jest tak ważna?</h2>
				<p>
					Ewidencja czasu pracy to nie tylko obowiązek wynikający z Kodeksu pracy, ale przede wszystkim
					narzędzie do lepszego zarządzania firmą. Pozwala na kontrolę godzin pracy, nadgodzin, urlopów
					i nieobecności, a także ułatwia rozliczenia z pracownikami oraz ZUS.
				</p>

				<h2 id="problemy">Najczęstsze problemy z tradycyjną ewidencją</h2>
				<ul>
					<li>Rozproszone dokumenty – papierowe listy obecności łatwo zgubić.</li>
					<li>Błędy w Excelu – pomyłki w formułach i ręcznych wpisach.</li>
					<li>Brak dostępu online – pracownicy i menedżerowie nie widzą aktualnych danych.</li>
					<li>Trudności w raportowaniu – przygotowanie zestawień zajmuje dużo czasu.</li>
				</ul>

				<h2 id="excel">Excel a ewidencja czasu pracy online</h2>
				<p>
					Wyszukiwania typu „ewidencja czasu pracy excel” często oznaczają próbę rozwiązania obowiązku kadrowego arkuszem. Excel na start może wystarczyć, lecz przy większej liczbie osób rośnie ryzyko błędów i braku jednej wspólnej wersji.{' '}
					<strong>Ewidencja czasu pracy online</strong> w aplikacji webowej zbiera wpisy w jednym miejscu, ułatwia rejestrację z telefonu i przygotowanie zestawień do PDF/XLSX. Szerszy opis elektronicznej formy:{' '}
					<Link href="/blog/elektroniczna-ewidencja-czasu-pracy">elektroniczna ewidencja czasu pracy — przewodnik</Link>
					.
				</p>

				<h2 id="rejestracja-online">Rejestracja czasu pracy online — system i aplikacja</h2>
				<p>
					<strong>Rejestracja czasu pracy online</strong> to po prostu wpisywanie godzin (lub start/stop) w systemie dostępnym z sieci — bez wysyłania skanów list do biura. W Planopii ten sam zespół może później rozszerzyć konto o moduł urlopów i inne funkcje HR w ramach płatnych pakietów. Porównanie modelu cenowego:{' '}
					<Link href="/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy">darmowa aplikacja do ewidencji czasu pracy i okres próbny</Link>
					.
				</p>
				<figure>
					<Image src={worktime.src} alt={worktime.alt} width={worktime.width} height={worktime.height} unoptimized />
					<figcaption>{worktime.caption}</figcaption>
				</figure>

				<ArticleCta
					title="Darmowa ewidencja czasu pracy do 5 kont"
					text={`Godziny, nadgodziny i wydruki PDF/Excel bez opłat dla zespołu do ${landingTrial.maxUsers} kont — na start ${LANDING_TRIAL_DAYS} dni pełnej aplikacji bez karty.`}
					link={{ href: REGISTER, label: 'Wypróbuj za darmo' }}
				/>

				<h2 id="program-funkcje">Program do ewidencji czasu pracy – co powinien mieć?</h2>
				<p>
					Nowoczesne aplikacje do ewidencji czasu pracy powinny być dostępne z dowolnego miejsca,
					proste w obsłudze i bezpieczne. Jeśli szukasz gotowego rozwiązania, zobacz nasz{' '}
					<Link href="/program-do-ewidencji-czasu-pracy">program do ewidencji czasu pracy</Link>
					. Oto kluczowe funkcje:
				</p>
				<ul>
					<li>Intuicyjny kalendarz pracy z możliwością wpisu godzin i nadgodzin.</li>
					<li>Automatyczne podsumowania i raporty (np. w PDF/XLSX).</li>
					<li>Obsługa urlopów i nieobecności z powiadomieniami e-mail.</li>
					<li>Dostępność na urządzeniach mobilnych (PWA i aplikacja webowa).</li>
					<li>Bezpieczne logowanie i ochrona danych pracowników.</li>
				</ul>
				<figure>
					<Image src={timeCalendar.src} alt={timeCalendar.alt} width={timeCalendar.width} height={timeCalendar.height} unoptimized />
					<figcaption>{timeCalendar.caption}</figcaption>
				</figure>

				<h2 id="planopia">Planopia – aplikacja do ewidencji czasu pracy</h2>
				<p>
					<strong>Planopia</strong> to polska aplikacja webowa, która automatyzuje procesy związane
					z czasem pracy i urlopami. Dzięki niej Twoja firma zyskuje:
				</p>
				<ul>
					<li>Pełną kontrolę nad ewidencją godzin pracy i nadgodzin.</li>
					<li>Szybkie zgłaszanie i akceptowanie urlopów.</li>
					<li>Raporty i kalendarze pracy dostępne online i w formie PDF.</li>
					<li>30 dni pełnej aplikacji dla do 5 użytkowników; potem bezpłatny plan ewidencji (do 5 aktywnych kont) lub pakiety płatne.</li>
					<li>Możliwość rozbudowy i personalizacji dla większych firm.</li>
				</ul>

				<ArticleCta
					title="Ewidencja, urlopy i raporty w jednym miejscu"
					text={`Wnioski urlopowe, raporty i asystent AI sprawdzisz w ${LANDING_TRIAL_DAYS}-dniowej próbie; po niej są w pakietach płatnych.`}
					link={{ href: REGISTER, label: 'Załóż darmowy zespół' }}
				/>

				<h2 id="podsumowanie">Podsumowanie</h2>
				<p>
					Ewidencja czasu pracy nie musi być skomplikowana. Dzięki aplikacjom takim jak
					<strong> Planopia</strong>, Twoja firma oszczędza czas, unika błędów i działa zgodnie z przepisami.
					Niezależnie, czy masz <strong>mały zespół do 5 osób</strong>, czy dużą organizację –
					z Planopią wszystko masz pod kontrolą.
				</p>

				<h2 id="faq-ewidencja-online">Najczęstsze pytania: ewidencja czasu pracy online</h2>
				<ArticleNote tone="paper">
					<dl>
						<dt>
							<strong>Czym jest ewidencja czasu pracy online?</strong>
						</dt>
						<dd>
							To prowadzenie rejestracji godzin pracy i nadgodzin w aplikacji dostępnej z przeglądarki lub telefonu (np. jako PWA), zamiast wyłącznie w papierze lub rozproszonych plikach Excel.
						</dd>
						<dt>
							<strong>Czy program do ewidencji czasu pracy online zastępuje Excel?</strong>
						</dt>
						<dd>
							Tak — typowy program do ewidencji przenosi wpisy i raporty do jednego systemu; plik Excel możesz nadal pobrać jako eksport danych, gdy potrzebujesz go do archiwum lub dalszej obróbki.
						</dd>
						<dt>
							<strong>Czy Planopia oferuje darmową ewidencję czasu pracy?</strong>
						</dt>
						<dd>
							Po 30 dniach pełnej aplikacji (do 5 użytkowników) możesz pozostać na bezpłatnym planie z ewidencją czasu pracy do 5 aktywnych kont albo wykupić pakiet płatny z urlopami i pozostałymi modułami.
						</dd>
					</dl>
				</ArticleNote>

				{/* Dawna ramka końcowa — nagłówek h3 i tekst zostają, bo są częścią zaindeksowanej treści */}
				<ArticleNote tone="mint">
					<p>Zacznij za darmo</p>
					<h3>Wypróbuj Planopię</h3>
					<p>Załóż darmowy zespół i zacznij ewidencję czasu pracy online.</p>
					<p>
						<a href={REGISTER}>Załóż darmowy zespół</a>
					</p>
				</ArticleNote>

				<div className="bart-extras">
					<BlogRelatedLinks slug="ewidencja-czasu-pracy-online" className="mt-10" />
					<BlogArticleCredibility
						author="Michał Lipka"
						authorHref="/o-autorze"
						updatedOn={{ iso: '2026-05-31', label: '31 maja 2026 r.' }}
					/>
				</div>
			</BlogArticleShell>
		</>
	)
}

export default BlogOne
