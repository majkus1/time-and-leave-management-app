import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Elektroniczna ewidencja czasu pracy - kompletny przewodnik | Planopia',
	description: 'Kompletny przewodnik po elektronicznej ewidencji czasu pracy. Dowiedz się jak wybrać najlepszy program do ewidencji czasu pracy dla swojej firmy. Planopia - darmowa aplikacja do ewidencji czasu pracy.',
	keywords: [
		'elektroniczna ewidencja czasu pracy',
		'program do ewidencji czasu pracy',
		'ewidencja czasu pracy online',
		'aplikacja do ewidencji czasu pracy',
		'program do rejestracji czasu pracy',
		'zarządzanie czasem pracy',
		'darmowa ewidencja czasu pracy',
		'Planopia',
		'time tracking software',
		'elektroniczna ewidencja',
		'program do urlopów',
		'aplikacja do urlopów'
	],
	authors: [{ name: 'Michał Lipka' }],
	creator: 'Michał Lipka',
	publisher: 'Planopia',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL('https://planopia.pl'),
	alternates: {
		canonical: 'https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy',
		languages: {
			'pl-PL': '/blog/elektroniczna-ewidencja-czasu-pracy',
			'en-US': '/en/blog/electronic-time-tracking',
		},
	},
	openGraph: {
		title: 'Elektroniczna ewidencja czasu pracy - kompletny przewodnik | Planopia',
		description: 'Kompletny przewodnik po elektronicznej ewidencji czasu pracy. Dowiedz się jak wybrać najlepszy program do ewidencji czasu pracy dla swojej firmy.',
		url: 'https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/desktop.png',
				width: 1200,
				height: 630,
				alt: 'Elektroniczna ewidencja czasu pracy - Planopia',
			},
		],
		locale: 'pl_PL',
		type: 'article',
		publishedTime: '2024-10-18T00:00:00.000Z',
		modifiedTime: '2024-10-18T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Elektroniczna ewidencja czasu pracy - kompletny przewodnik | Planopia',
		description: 'Kompletny przewodnik po elektronicznej ewidencji czasu pracy. Dowiedz się jak wybrać najlepszy program do ewidencji czasu pracy dla swojej firmy.',
		images: ['/img/desktop.png'],
		creator: '@planopia',
	},
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
	category: 'technology',
}

export default function BlogFiveLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
