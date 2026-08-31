import type { Metadata } from 'next'

const META_TITLE = 'Urlop wypoczynkowy 2026: ile dni? Kalkulator | Planopia'
const META_DESCRIPTION =
	'Urlop wypoczynkowy w 2026 roku: sprawdź wymiar 20 lub 26 dni, zasady dla niepełnego etatu i stażu oraz użyj prostego kalkulatora urlopu.'
const URL = 'https://planopia.pl/blog/urlop-wypoczynkowy-ile-dni'
const IMAGE = 'https://planopia.pl/img/urlop-wypoczynkowy-ile-dni.webp'

export const metadata: Metadata = {
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'urlop wypoczynkowy',
		'ile dni urlopu',
		'wymiar urlopu 2026',
		'kalkulator urlopu',
		'urlop na pół etatu',
		'staż urlopowy',
		'nowe przepisy urlop 2026',
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
	alternates: {
		canonical: URL,
		languages: { pl: URL, 'x-default': URL },
	},
	openGraph: {
		type: 'article',
		locale: 'pl_PL',
		url: URL,
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		publishedTime: '2026-08-02T08:00:00.000Z',
		modifiedTime: '2026-08-02T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [{
			url: IMAGE,
			width: 1200,
			height: 630,
			alt: 'Kalendarz urlopowy z wymiarem 20 i 26 dni oraz kalkulatorem',
		}],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [IMAGE],
	},
	category: 'Prawo pracy',
}

export default function AnnualLeaveEntitlementLayout({ children }: { children: React.ReactNode }) {
	return children
}
