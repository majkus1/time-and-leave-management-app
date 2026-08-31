import type { Metadata } from 'next'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Program dla firmy sprzątającej: grafik pracy | Planopia' },
	description:
		'Planuj grafik ekip sprzątających, ewidencję godzin, urlopy, zastępstwa i zadania w jednym systemie. Dla firm obsługujących wiele obiektów. 30 dni gratis.',
	keywords: [
		'program dla firmy sprzątającej',
		'aplikacja dla firm sprzątających',
		'grafik pracy firma sprzątająca',
		'grafik ekip sprzątających',
		'ewidencja czasu pracy pracowników sprzątających',
		'zarządzanie firmą sprzątającą',
		'program do zarządzania firmą sprzątającą',
		'Planopia',
	],
	authors: [{ name: 'Michał Lipka' }],
	creator: 'Michał Lipka',
	publisher: 'Planopia',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	openGraph: {
		type: 'website',
		locale: 'pl_PL',
		url: '/dla-firm-sprzatajacych',
		siteName: 'Planopia',
		title: 'Program dla firmy sprzątającej: grafik pracy | Planopia',
		description: 'Grafik ekip, godziny, urlopy, zastępstwa i zadania w jednym systemie.',
		images: [{ url: '/img/sprzatajaca.webp', width: 1536, height: 1024, alt: 'Planopia — organizacja pracy firmy sprzątającej' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Program dla firmy sprzątającej — Planopia',
		description: 'Grafik ekip, ewidencja godzin, urlopy i zadania w jednym miejscu.',
		images: ['/img/sprzatajaca.webp'],
	},
	// Brak wersji EN tej strony — deklarujemy ja jako wylacznie polska,
	// zeby nie obiecywac Google odpowiednika, ktorego nie ma.
	alternates: {
		canonical: '/dla-firm-sprzatajacych',
		languages: {
			'x-default': '/dla-firm-sprzatajacych',
			pl: '/dla-firm-sprzatajacych',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
