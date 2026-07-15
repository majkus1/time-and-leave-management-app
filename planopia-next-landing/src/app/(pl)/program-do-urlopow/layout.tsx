import type { Metadata } from 'next'


export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: 'Program do urlopów online — wnioski i kalendarz | Planopia' },
	description:
		'Program do urlopów online: wnioski, akceptacje i kalendarz zespołu. 30 dni za darmo, potem plan z urlopami od 119 zł netto/mies.',
	keywords: [
		'program do urlopów',
		'aplikacja do urlopów',
		'program do zarządzania urlopami',
		'wnioski urlopowe online',
		'kalendarz urlopów',
		'program kadrowy do urlopów',
		'zarządzanie urlopami',
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
		url: '/program-do-urlopow',
		siteName: 'Planopia',
		title: 'Program do urlopów online — wnioski i kalendarz | Planopia',
		description:
			'Wnioski urlopowe, akceptacje i kalendarz urlopów w jednej aplikacji. 30 dni pełnej Planopii za darmo, potem plan z urlopami od 119 zł netto/mies.',
		images: [
			{
				url: '/img/plans-urlopnew.webp',
				width: 1200,
				height: 630,
				alt: 'Program do urlopów Planopia — kalendarz i wnioski urlopowe',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Program do urlopów dla firmy — Planopia',
		description: 'Wnioski urlopowe, akceptacje i kalendarz urlopów online. 30 dni pełnej aplikacji za darmo.',
		images: ['/img/plans-urlopnew.webp'],
	},
	alternates: {
		canonical: '/program-do-urlopow',
		languages: {
			'x-default': '/program-do-urlopow',
			pl: '/program-do-urlopow',
			en: '/en/leave-management-software',
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
