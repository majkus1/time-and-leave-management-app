import { blogArticleOfferLine } from '@/data/planOfferingCopy'
import { BLOG_LEAVE_PROGRAM_OG } from '@/data/blogLeaveProgramAssets'

export const blogProgramUrlopowCopy = {
	url: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
	slug: 'program-do-urlopow-dla-malej-firmy',
	programHref: '/program-do-urlopow',
	headline: 'Program do urlopów dla małej firmy — jak wybrać (2026)',
	description:
		'Jak wybrać program do urlopów dla małej firmy w 2026: kryteria, funkcje, koszt i czy istnieje darmowy program do urlopów. Wnioski, kalendarz i akceptacje online w Planopii.',
	datePublished: '2026-05-31',
	dateModified: '2026-05-31',
	faqs: [
		{
			q: 'Czy jest darmowy program do urlopów dla małej firmy?',
			a: 'W Planopii przez 30 dni masz pełną aplikację za darmo (do 5 użytkowników), w tym moduł urlopowy: wnioski, kalendarz i akceptacje. Po okresie próbnym możesz zostać na bezpłatnym planie ewidencji czasu pracy (do 5 aktywnych kont), a pełny moduł urlopowy dostępny jest w pakiecie płatnym.',
		},
		{
			q: 'Ile osób obsłuży program w małej firmie?',
			a: 'Plany płatne zaczynają się od zespołów do 5 osób i rosną progami do 100 osób, a większe firmy dostają wycenę indywidualną. Mała firma zwykle mieści się w najniższym progu planu Core — szczegóły na stronie programu do urlopów i w cenniku.',
		},
		{
			q: 'Czy muszę rezygnować z Excela od razu?',
			a: 'Nie. Wiele małych firm migruje etapami — najpierw porządkuje roczny plan urlopów w Excelu/PDF, a potem przenosi wnioski i akceptacje do aplikacji.',
		},
		{
			q: 'Czy Planopia to tylko urlopy?',
			a: blogArticleOfferLine.pl,
		},
	],
} as const
