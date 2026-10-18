import Image from 'next/image'
import Link from 'next/link'
import BlogArticleShell, { ArticleCta } from './blogArticle/BlogArticleShell'
import BlogRelatedLinks from './BlogRelatedLinks'
import LeaveTemplateBanner from './LeaveTemplateBanner'
import BlogArticleCredibility from './BlogArticleCredibility'
import { shot } from '@/data/productShots'
import { LANDING_TRIAL_DAYS, landingCoreTiers, landingTrial } from '@/data/landingPlanPricing'

const REGISTER = 'https://app.planopia.pl/team-registration'

/** /blog/planowanie-urlopow — treść bez zmian, oprawa jak strony produktowe (BlogArticleShell). */
function BlogThree() {
	const leavePlans = shot('pl', 'leave-plans')

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
						"description": "Planowanie urlopów w firmie z Planopią: 30 dni pełnej aplikacji (do 5 osób), potem darmowa ewidencja czasu pracy do 5 aktywnych kont lub pakiety płatne z kalendarzem urlopowym, akceptacjami i raportami HR.",
						"image": "https://planopia.pl/img/plans-urlopnew.webp",
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
						"url": "https://planopia.pl/blog/planowanie-urlopow",
						"datePublished": "2025-08-25",
						"dateModified": "2026-05-17"
					})
				}}
			/>

			<BlogArticleShell
				crumb={{ label: 'Urlopy i planowanie', href: '/blog#urlopy' }}
				pill="Planowanie urlopów"
				h1="Aplikacja do urlopów: planowanie, wnioski i kalendarz online"
				lead={
					<p>
						<strong>Planowanie urlopów</strong> to jedno z najczęstszych wyzwań w działach HR i u menedżerów zespołów.
						Tradycyjne metody – papierowe wnioski czy Excel – prowadzą do chaosu i błędów.
						Dowiedz się, jak <strong>kalendarz urlopowy online</strong> i aplikacje takie jak Planopia
						pomagają w prostym i skutecznym zarządzaniu nieobecnościami.
					</p>
				}
				primary={{ href: REGISTER, label: 'Załóż darmowy zespół' }}
				secondary={{ href: '/#cennik', label: 'Zobacz cennik' }}
				note={
					<>
						<strong>Darmowa ewidencja czasu pracy</strong> — 30 dni z modułem urlopów; potem bezpłatna ewidencja do 5 kont lub pakiet z urlopami
					</>
				}
				meta={{ iso: '2026-05-17', label: 'Zaktualizowano 17 maja 2026 r. · Michał Lipka' }}
				image={{ src: '/img/plans-urlopnew.webp', alt: 'Program do planowania urlopów – Planopia', width: 1918, height: 910 }}
				toc={[
					{ id: 'dlaczego-planowanie', label: 'Dlaczego planowanie urlopów jest kluczowe?' },
					{ id: 'problemy', label: 'Najczęstsze problemy' },
					{ id: 'jak-usprawnic', label: 'Jak usprawnić planowanie urlopów?' },
					{ id: 'planopia', label: 'Planopia – aplikacja do urlopów' },
					{ id: 'podsumowanie', label: 'Podsumowanie' },
				]}
				cta={{
					title: 'Zaplanuj urlopy zespołu bez Excela',
					note: `${LANDING_TRIAL_DAYS} dni pełnej aplikacji za darmo, do ${landingTrial.maxUsers} osób, bez karty. Potem plan Core z urlopami od ${landingCoreTiers[0].monthlyNetPln} zł netto miesięcznie albo darmowa ewidencja czasu pracy.`,
					primary: { href: REGISTER, label: 'Załóż darmowy zespół' },
				}}
			>
				<h2 id="dlaczego-planowanie">Dlaczego planowanie urlopów jest kluczowe?</h2>
				<p>
					Brak przejrzystości w urlopach powoduje konflikty, niedobory kadrowe i spadek efektywności.
					 <strong> Centralny kalendarz urlopowy</strong> pozwala zachować ciągłość pracy i unikać sytuacji, w których kilku
					kluczowych pracowników znika w tym samym czasie. Dobre zarządzanie urlopami wspiera także morale i satysfakcję pracowników.
				</p>

				<h2 id="problemy">Najczęstsze problemy w zarządzaniu urlopami</h2>
				<ul>
					<li>Brak wspólnego kalendarza urlopowego dla zespołu</li>
					<li>Ręczne wnioski w Excelu lub na papierze – podatne na błędy</li>
					<li>Brak automatycznych powiadomień o wnioskach</li>
					<li>Pokrywające się urlopy kluczowych osób</li>
					<li>Brak historii urlopowej i łatwego dostępu do raportów</li>
				</ul>

				<h2 id="jak-usprawnic">Jak usprawnić planowanie urlopów?</h2>
				<p>
					Wdrożenie <strong>aplikacji do urlopów</strong> rozwiązuje większość problemów. Dzięki Planopii możesz:
				</p>
				<ul>
					<li>Udostępnić pracownikom wspólny kalendarz nieobecności</li>
					<li>Automatycznie wysyłać powiadomienia do przełożonych</li>
					<li>Wprowadzić role i priorytety w akceptacji urlopów</li>
					<li>Unikać konfliktów urlopowych dzięki widoczności całego zespołu</li>
					<li>Eksportować dane do raportów w PDF i XLSX</li>
				</ul>

				<ArticleCta
					title="Kalendarz urlopów zespołu w Planopii"
					text={`Wnioski, akceptacje i kalendarz nieobecności w jednym miejscu — ${LANDING_TRIAL_DAYS} dni pełnej aplikacji bez karty.`}
					link={{ href: REGISTER, label: 'Wypróbuj za darmo' }}
				/>

				<h2 id="planopia">Planopia – aplikacja do planowania urlopów</h2>
				<p>
					<strong>Planopia</strong> to prosta w obsłudze aplikacja, która łączy <strong>ewidencję czasu pracy</strong>{' '}
					z planowaniem urlopów. Przez pierwszy miesiąc (30 dni) masz pełne moduły w zespole do 5 osób; po próbie urlopy i pozostałe funkcje HR są w pakietach płatnych, a ewidencję czasu możesz prowadzić dalej bezpłatnie (do 5 aktywnych kont).
					Jeśli szukasz gotowego narzędzia, zobacz nasz{' '}
					<Link href="/program-do-urlopow">program do urlopów</Link>{' '}
					— a wybór dla mniejszego zespołu ułatwi przewodnik{' '}
					<Link href="/blog/program-do-urlopow-dla-malej-firmy">program do urlopów dla małej firmy</Link>
					.
				</p>
				<figure>
					<Image src={leavePlans.src} alt={leavePlans.alt} width={leavePlans.width} height={leavePlans.height} unoptimized />
					<figcaption>{leavePlans.caption}</figcaption>
				</figure>
				<ul>
					<li>Pracownicy składają wnioski urlopowe online</li>
					<li>Menedżerowie akceptują wnioski jednym kliknięciem</li>
					<li>Urlopy trafiają od razu do kalendarza zespołu</li>
					<li>Historia i raporty urlopów w jednym miejscu</li>
				</ul>

				<h2 id="podsumowanie">Podsumowanie</h2>
				<p>
					<strong>Planowanie urlopów online</strong> to sposób na porządek, przejrzystość i mniej stresu w zarządzaniu firmą.
					Dzięki aplikacji Planopia unikniesz chaosu, przyspieszysz akceptacje i zyskasz kontrolę nad dostępnością zespołu.
					Zacznij od <strong>30 dni pełnej aplikacji</strong> (do 5 osób), potem zostań na darmowej ewidencji lub wykup moduł urlopów w pakiecie płatnym.
				</p>

				<p>
					Wypróbuj Planopię – <Link href={REGISTER}>Załóż darmowy zespół i zacznij planować urlopy online</Link>.
				</p>

				<div className="bart-extras">
					<LeaveTemplateBanner />
					<BlogRelatedLinks slug="planowanie-urlopow" />
					<BlogArticleCredibility
						author="Michał Lipka"
						authorHref="/o-autorze"
						updatedOn={{ iso: '2026-05-17', label: '17 maja 2026 r.' }}
					/>
				</div>
			</BlogArticleShell>
		</>
	)
}

export default BlogThree
