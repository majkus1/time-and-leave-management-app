import type { Metadata } from 'next'

const META_TITLE = 'Rejestracja czasu pracy QR i lista obecności | Planopia'
const META_DESCRIPTION =
	'Rejestracja czasu pracy przez kod QR zamiast papierowej listy obecności. Wejście i wyjście skanem z telefonu, godziny od razu w ewidencji.'
const IMAGE = '/img/desktopnews.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'rejestracja czasu pracy',
		'rejestracja czasu pracy QR',
		'elektroniczna lista obecności',
		'aplikacja do listy obecności',
		'lista obecności online',
		'kontrola czasu pracy',
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
		url: '/rejestracja-czasu-pracy-qr',
		siteName: 'Planopia',
		title: META_TITLE,
		description:
			'Kod QR w wejściu zamiast papierowej listy obecności. Pracownik skanuje telefonem, a godziny trafiają prosto do ewidencji czasu pracy.',
		images: [
			{
				url: IMAGE,
				width: 1918,
				height: 910,
				alt: 'Rejestracja czasu pracy przez QR w aplikacji Planopia',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Rejestracja czasu pracy przez QR — Planopia',
		description: 'Skan kodu zamiast podpisu na liście. Godziny od razu w ewidencji. 30 dni pełnej aplikacji za darmo.',
		images: [IMAGE],
	},
	alternates: {
		canonical: '/rejestracja-czasu-pracy-qr',
		languages: {
			'x-default': '/rejestracja-czasu-pracy-qr',
			pl: '/rejestracja-czasu-pracy-qr',
			en: '/en/qr-time-clocking',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
