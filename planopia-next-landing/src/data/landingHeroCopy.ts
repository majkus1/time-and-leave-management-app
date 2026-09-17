export const landingHeroCopy = {
	pl: {
		eyebrow: 'Wszystko w jednym miejscu',
		cta: 'Załóż darmowy zespół',
		// Druga sciezka: wieksze firmy zwykle chca porozmawiac, zanim zaloza konto.
		secondaryCta: 'Umów rozmowę',
		secondaryCtaHref: '/kontakt',
		// Trzecia sciezka: pytanie do asystenta zamiast telefonu z pytaniem „czy QR skanuje sie telefonem”.
		askAssistant: 'Masz pytanie? Zapytaj asystenta, jak działa Planopia',
		askAssistantHref: '#asystent',
		// Zamiast podtytułu: to, czego H1 nie mówi — plan darmowy jest bezterminowy, 30 dni pełnej wersji to bonus.
		proof: ['Do 5 osób za darmo, bezterminowo', '30 dni pełnej wersji', 'Bez karty'],
		imageAlt: 'biznesmen zaznaczający aplikację',
	},
	en: {
		eyebrow: 'Everything in one place',
		cta: 'Create your free team',
		secondaryCta: 'Book a call',
		secondaryCtaHref: '/en#contact',
		askAssistant: 'Have a question? Ask the assistant how Planopia works',
		askAssistantHref: '#assistant',
		proof: ['Free for up to 5 people, no time limit', '30 days of the full version', 'No card needed'],
		imageAlt: 'businessman managing calendar in the app',
	},
} as const
