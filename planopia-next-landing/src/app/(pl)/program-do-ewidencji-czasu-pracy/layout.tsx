import type { Metadata } from 'next'


export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Program do ewidencji czasu pracy online | Planopia' },
	description:
		'Program do ewidencji czasu pracy online: godziny, nadgodziny i raporty PDF/Excel. 30 dni za darmo, potem darmowa ewidencja do 5 kont.',
	keywords: [
		'program do ewidencji czasu pracy',
		'ewidencja czasu pracy program',
		'ewidencja czasu pracy program darmowy',
		'program do rejestracji czasu pracy',
		'aplikacja do ewidencji czasu pracy',
		'darmowa ewidencja czasu pracy',
		'system ewidencji czasu pracy',
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
		alternateLocale: ['en_US'],
		url: '/program-do-ewidencji-czasu-pracy',
		siteName: 'Planopia',
		title: 'Program do ewidencji czasu pracy online | Planopia',
		description:
			'Rejestracja godzin, nadgodziny i raporty PDF/Excel w jednej aplikacji. 30 dni pełnej Planopii, potem darmowa ewidencja do 5 aktywnych kont.',
		images: [
			{
				url: '/img/desktopnews.webp',
				width: 1200,
				height: 630,
				alt: 'Program do ewidencji czasu pracy Planopia — kalendarz i raporty',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Program do ewidencji czasu pracy — Planopia',
		description: 'Godziny, nadgodziny i raporty PDF/Excel online. 30 dni pełnej aplikacji, potem darmowa ewidencja do 5 kont.',
		images: ['/img/desktopnews.webp'],
	},
	alternates: {
		canonical: '/program-do-ewidencji-czasu-pracy',
		languages: {
			'x-default': '/program-do-ewidencji-czasu-pracy',
			pl: '/program-do-ewidencji-czasu-pracy',
			en: '/en/time-tracking-software',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
