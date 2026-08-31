import type { Metadata } from 'next'

const META_TITLE = 'Michał Lipka — autor tekstów | Planopia'
const META_DESCRIPTION =
	'Michał Lipka — twórca Planopii, aplikacji do ewidencji czasu pracy i urlopów. Kto pisze teksty na blogu i na jakich źródłach się opierają.'
const PAGE_URL = 'https://planopia.pl/o-autorze'
const IMAGE = '/img/1709827103942.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	authors: [{ name: 'Michał Lipka' }],
	creator: 'Michał Lipka',
	publisher: 'Planopia',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	// Strona istnieje tylko po polsku — blog EN ma inna, uboższą obsadę wpisów.
	alternates: {
		canonical: '/o-autorze',
		languages: {
			'x-default': '/o-autorze',
			pl: '/o-autorze',
		},
	},
	openGraph: {
		type: 'profile',
		locale: 'pl_PL',
		url: PAGE_URL,
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [
			{
				url: IMAGE,
				width: 200,
				height: 200,
				alt: 'Michał Lipka — twórca Planopii',
			},
		],
	},
	twitter: {
		card: 'summary',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [IMAGE],
	},
}

export default function OAutorzeLayout({ children }: { children: React.ReactNode }) {
	return children
}
