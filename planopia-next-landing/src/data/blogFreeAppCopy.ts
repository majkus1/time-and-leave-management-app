export type BlogFreeAppLocale = 'pl' | 'en'

export const blogFreeAppCopy = {
	pl: {
		slug: 'darmowa-aplikacja-do-ewidencji-czasu-pracy',
		url: 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
		headline: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia',
		heroH1: 'Ewidencja czasu pracy i urlopy — pierwszy miesiąc za darmo',
		heroLead:
			'30 dni pełnej aplikacji dla zespołu do 5 osób — bez karty na start. Potem darmowa ewidencja (5 kont) lub pakiety płatne.',
		pricingHref: '/#cennik',
		pricingLabel: 'Szczegóły w cenniku',
		cta: 'Załóż darmowy zespół',
		datePublished: '2024-10-18',
		dateModified: '2026-03-27',
		metaDescription:
			'Planopia: 30 dni pełnej aplikacji dla zespołu do 5 osób, bez karty na start; potem darmowa ewidencja do 5 kont lub pakiety — urlopy, grafik, czat i AI w cenniku.',
		faqs: [
			{
				q: 'Czy jest okres próbny?',
				a: 'Tak. Przez 30 dni masz pełne funkcje za darmo w zespole do 5 użytkowników (limit wiadomości Asystenta AI w tym czasie). Bez karty płatniczej i bez zobowiązania.',
			},
			{
				q: 'Jak długo trwa darmowy okres?',
				a: '30 dni — pierwszy miesiąc z pełnymi funkcjami dla do 5 użytkowników. Potem możesz zostać na bezpłatnym planie ewidencji czasu pracy (do 5 aktywnych kont) albo wykupić pakiet z urlopami i pozostałymi modułami.',
			},
			{
				q: 'Czy moje dane są bezpieczne?',
				a: 'Tak. Wszystkie dane są szyfrowane, przechowywane na bezpiecznych serwerach i regularnie archiwizowane. Aplikacja jest zgodna z RODO.',
			},
			{
				q: 'Czy mogę eksportować dane?',
				a: 'Tak. Możesz eksportować dane do formatów PDF i Excel bez ograniczeń. Twoje dane zawsze pozostają Twoje.',
			},
		],
	},
	en: {
		slug: 'free-time-tracking-app',
		url: 'https://planopia.pl/en/blog/free-time-tracking-app',
		headline: 'Free Time Tracking App for Work Hours and Leave Management | Planopia',
		heroH1: 'Free time tracking app — full product for 30 days',
		heroLead:
			'30 days full access for teams of up to 5 people — no credit card required to get started. Then free time tracking (5 accounts) or paid plans.',
		pricingHref: '/en#prices',
		pricingLabel: 'See pricing',
		cta: 'Create your free team today',
		datePublished: '2024-10-18',
		dateModified: '2026-03-27',
		metaDescription:
			'Planopia: 30-day full trial for teams up to 5 people, no card required to start; then free time tracking for 5 accounts or paid plans with leave, schedules, chat, and AI.',
		faqs: [
			{
				q: 'Is there a free trial?',
				a: 'Yes. For 30 days you get full features for free in a team of up to 5 users (AI Assistant message limit during trial). No credit card and no commitment required.',
			},
			{
				q: 'How long does the free period last?',
				a: '30 days — first month with full features for up to 5 users. After that you can stay on the free time tracking plan (up to 5 active accounts) or buy a package with leave and other modules.',
			},
			{
				q: 'Is my data secure?',
				a: 'Yes. All data is encrypted, stored on secure servers, and regularly backed up. The app is GDPR-compliant.',
			},
			{
				q: 'Can I export data?',
				a: 'Yes. You can export data to PDF and Excel without limits. Your data always remains yours.',
			},
		],
	},
} as const
