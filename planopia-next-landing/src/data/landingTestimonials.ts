// Opinie klientów na stronie głównej (PL / EN). Tylko opinie przesłane przez klienta do publikacji na stronie —
// treść bez zmian (w EN tłumaczenie z dopiskiem). Logo w public/img/clients (przezroczyste tło, ~480 px szerokości).

export type Testimonial = {
	id: string
	company: string
	logo: { src: string; fallback: string; width: number; height: number }
	quote: { pl: string; en: string }
	author: { pl: string; en: string }
	role: { pl: string; en: string }
	/** Od kiedy klient korzysta — tylko gdy znamy datę */
	since?: { pl: string; en: string }
}

export const landingTestimonials: Testimonial[] = [
	{
		id: 'halo-rental-system',
		company: 'Halo Rental System',
		logo: { src: '/img/clients/halo-rental-system.webp', fallback: '/img/clients/halo-rental-system.png', width: 480, height: 229 },
		quote: {
			pl: 'Polecam współpracę z panem Michałem, problemy i uwagi rozwiązywane są w błyskawicznym czasie, a sama platforma bardzo przejrzysta i prosta w obsłudze.',
			en: 'I recommend working with Michał — issues and feedback are resolved in no time, and the platform itself is very clear and easy to use.',
		},
		author: { pl: 'Klaudia Pawłowska', en: 'Klaudia Pawłowska' },
		role: { pl: 'Główna Księgowa', en: 'Chief Accountant' },
	},
	{
		id: 'smart-cube',
		company: 'Smart City Stargard',
		logo: { src: '/img/clients/smart-city-stargard.webp', fallback: '/img/clients/smart-city-stargard.png', width: 480, height: 319 },
		quote: {
			pl: 'Używam aplikacji planopia.pl do ewidencji czasu pracy. Aplikacja przejrzysta, bardzo intuicyjna. Wszystko w jednym miejscu: lista obecności, godziny pracy, grafiki, a przede wszystkim urlopy – wnioski składane i zatwierdzane elektronicznie. Tablica zadań bardzo pomocna w planowaniu zadań, które widzi cały zespół lub wybrane osoby. Kontakt z obsługą programu bardzo dobry. Polecam.',
			en: 'I use planopia.pl for time tracking. The app is clear and very intuitive. Everything in one place: attendance, working hours, schedules and, above all, leave — requests submitted and approved electronically. The task board is very helpful for planning work that the whole team or selected people can see. Contact with support is very good. Recommended.',
		},
		author: { pl: 'Zespół Smart Cube', en: 'Smart Cube team' },
		role: { pl: 'Budownictwo mieszkaniowe', en: 'Residential construction' },
	},
]

export const testimonialsCopy = {
	pl: {
		eyebrow: 'Opinie klientów',
		title: 'Firmy, które pracują z Planopią na co dzień',
		intro: 'Ewidencja czasu, urlopy i grafiki w prawdziwych zespołach — oto, co mówią nasi klienci.',
		translated: null as string | null,
		carousel: { region: 'Opinie klientów', prev: 'Poprzednia opinia', next: 'Następna opinia', goTo: 'Pokaż opinię' },
	},
	en: {
		eyebrow: 'Customer stories',
		title: 'Teams that run on Planopia every day',
		intro: 'Time tracking, leave and schedules in real teams — here is what our customers say.',
		translated: 'Translated from Polish',
		carousel: { region: 'Customer stories', prev: 'Previous story', next: 'Next story', goTo: 'Show story' },
	},
}
