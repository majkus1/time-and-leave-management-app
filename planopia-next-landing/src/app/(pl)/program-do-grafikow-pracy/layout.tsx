import type { Metadata } from 'next'

const META_TITLE = 'Program do grafików pracy online | Planopia'
const META_DESCRIPTION =
	'Program do tworzenia grafików pracy online: zmiany, minimalna obsada, automatyczne wypełnianie z uwzględnieniem urlopów i świąt. 30 dni za darmo.'
const IMAGE = '/img/aigrafik.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'program do grafiku pracy',
		'aplikacja do grafiku pracy',
		'grafik pracy online',
		'program do grafików pracy',
		'grafik zmianowy',
		'harmonogram pracy online',
		'planowanie grafiku pracy',
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
		url: '/program-do-grafikow-pracy',
		siteName: 'Planopia',
		title: META_TITLE,
		description:
			'Ułóż grafik zmianowy dla zespołu w jednym miejscu. Automatyczne wypełnianie pomija urlopy, święta i weekendy. 30 dni pełnej aplikacji za darmo.',
		images: [
			{
				url: IMAGE,
				width: 1898,
				height: 910,
				alt: 'Program do grafików pracy Planopia — grafik zespołu',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Program do grafików pracy — Planopia',
		description: 'Grafik zmianowy online z automatycznym wypełnianiem. 30 dni pełnej aplikacji za darmo.',
		images: [IMAGE],
	},
	alternates: {
		canonical: '/program-do-grafikow-pracy',
		languages: {
			'x-default': '/program-do-grafikow-pracy',
			pl: '/program-do-grafikow-pracy',
			en: '/en/work-schedule-software',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
