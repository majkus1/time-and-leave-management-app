import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Zarządzanie urlopami w firmie - kompletny przewodnik | Planopia',
	description: 'Kompletny przewodnik po zarządzaniu urlopami w firmie. Dowiedz się jak efektywnie planować, ewidencjonować i zatwierdzać wnioski urlopowe. Planopia - darmowa aplikacja do zarządzania urlopami.',
	keywords: [
		'zarządzanie urlopami',
		'aplikacja do urlopów',
		'program do urlopów',
		'zarządzanie urlopami w firmie',
		'system urlopowy',
		'planowanie urlopów',
		'ewidencja urlopów',
		'wnioski urlopowe',
		'Planopia',
		'urlopy w firmie',
		'automatyzacja urlopów',
		'zarządzanie nieobecnościami'
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
		canonical: '/blog/zarzadzanie-urlopami',
		languages: {
			'pl-PL': '/blog/zarzadzanie-urlopami',
			'en-US': '/en/blog/leave-management',
		},
	},
	openGraph: {
		title: 'Zarządzanie urlopami w firmie - kompletny przewodnik | Planopia',
		description: 'Kompletny przewodnik po zarządzaniu urlopami w firmie. Dowiedz się jak efektywnie planować, ewidencjonować i zatwierdzać wnioski urlopowe.',
		url: 'https://planopia.pl/blog/zarzadzanie-urlopami',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/desktop.png',
				width: 1200,
				height: 630,
				alt: 'Zarządzanie urlopami w firmie - Planopia',
			},
		],
		locale: 'pl_PL',
		type: 'article',
		publishedTime: '2024-10-25T00:00:00.000Z',
		modifiedTime: '2024-10-25T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Zarządzanie urlopami w firmie - kompletny przewodnik | Planopia',
		description: 'Kompletny przewodnik po zarządzaniu urlopami w firmie. Dowiedz się jak efektywnie planować, ewidencjonować i zatwierdzać wnioski urlopowe.',
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

export default function BlogSixLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
