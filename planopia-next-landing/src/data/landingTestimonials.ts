// Opinie klientów na stronie głównej (PL / EN). Tylko opinie przesłane przez klienta do publikacji na stronie —
// treść bez zmian (w EN tłumaczenie z dopiskiem). Logo w public/img/clients (przezroczyste tło, ~480 px szerokości).

export type Testimonial = {
	id: string
	company: string
	logo: { src: string; fallback: string; width: number; height: number }
	quote: { pl: string; en: string }
	author: string
	role: { pl: string; en: string }
	since: { pl: string; en: string }
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
		author: 'Klaudia Pawłowska',
		role: { pl: 'Główna Księgowa', en: 'Chief Accountant' },
		since: { pl: 'Z Planopią od 2025 r.', en: 'Using Planopia since 2025' },
	},
]

export const testimonialsCopy = {
	pl: {
		eyebrow: 'Opinie klientów',
		title: 'Firmy, które pracują z Planopią na co dzień',
		intro: 'Ewidencja czasu, urlopy i grafiki w prawdziwych zespołach — oto, co mówią nasi klienci.',
		translated: null as string | null,
	},
	en: {
		eyebrow: 'Customer stories',
		title: 'Teams that run on Planopia every day',
		intro: 'Time tracking, leave and schedules in real teams — here is what our customers say.',
		translated: 'Translated from Polish',
	},
}
