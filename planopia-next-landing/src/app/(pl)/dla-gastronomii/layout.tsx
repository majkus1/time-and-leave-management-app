import type { Metadata } from 'next'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Grafik pracy dla gastronomii i restauracji | Planopia' },
	description:
		'Grafik pracy gastronomii, ewidencja godzin, urlopy i zadania w jednym systemie. Dla restauracji, kawiarni, barów i cateringu. 30 dni za darmo.',
	keywords: [
		'grafik pracy gastronomia',
		'program do grafiku restauracji',
		'aplikacja do grafiku pracy restauracji',
		'grafik pracowników restauracji',
		'ewidencja czasu pracy gastronomia',
		'grafik zmianowy restauracja',
		'program dla gastronomii',
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
		url: '/dla-gastronomii',
		siteName: 'Planopia',
		title: 'Grafik pracy dla gastronomii i restauracji | Planopia',
		description: 'Zmiany, godziny, urlopy i zadania zespołu restauracji w jednym systemie.',
		images: [{ url: '/img/gastronomia.webp', width: 1536, height: 1024, alt: 'Planopia — grafik pracy i organizacja zespołu gastronomii' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Grafik pracy dla gastronomii — Planopia',
		description: 'Grafik restauracji, ewidencja godzin, urlopy i zadania w jednym miejscu.',
		images: ['/img/gastronomia.webp'],
	},
	alternates: { canonical: '/dla-gastronomii' },
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
