import type { Metadata } from 'next'

const META_TITLE = 'Ewidencja nadgodzin — rozliczanie godzin | Planopia'
const META_DESCRIPTION =
	'Ewidencja nadgodzin online: godziny nadliczbowe przy konkretnym dniu, raporty PDF i Excel. Działa też w bezpłatnym planie do 5 kont.'
const IMAGE = '/img/desktopnews.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'ewidencja nadgodzin',
		'program do ewidencji nadgodzin',
		'rozliczanie nadgodzin',
		'godziny nadliczbowe ewidencja',
		'ewidencja czasu pracy nadgodziny',
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
		url: '/ewidencja-nadgodzin',
		siteName: 'Planopia',
		title: META_TITLE,
		description:
			'Nadgodziny przy konkretnym dniu zamiast ryczałtu na koniec miesiąca. Raporty PDF i Excel. Bezpłatny plan do 5 aktywnych kont.',
		images: [
			{
				url: IMAGE,
				width: 1918,
				height: 910,
				alt: 'Ewidencja nadgodzin w aplikacji Planopia',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Ewidencja nadgodzin — Planopia',
		description: 'Nadgodziny przy konkretnym dniu, raporty PDF i Excel. Bezpłatny plan do 5 kont.',
		images: [IMAGE],
	},
	alternates: {
		canonical: '/ewidencja-nadgodzin',
		languages: {
			'x-default': '/ewidencja-nadgodzin',
			pl: '/ewidencja-nadgodzin',
			en: '/en/overtime-tracking',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
