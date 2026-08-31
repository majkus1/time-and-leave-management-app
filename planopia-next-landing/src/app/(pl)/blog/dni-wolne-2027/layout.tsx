import type { Metadata } from 'next'

const META_TITLE = 'Dni wolne 2027 — kalendarz świąt w Polsce | Planopia'
const META_DESCRIPTION =
	'Kalendarz dni wolnych 2027: wszystkie 14 świąt ustawowych z Wigilią, dwa wypadające w sobotę i długie weekendy w jednym miejscu.'
const PAGE_URL = 'https://planopia.pl/blog/dni-wolne-2027'
const IMAGE = 'https://planopia.pl/img/plan-urlopow-2027-excel-pdf.webp'

export const metadata: Metadata = {
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'dni wolne 2027',
		'święta 2027',
		'kalendarz dni wolnych 2027',
		'dni ustawowo wolne 2027',
		'długie weekendy 2027',
		'święto w sobotę 2027',
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
	alternates: {
		canonical: PAGE_URL,
		languages: { pl: PAGE_URL, 'x-default': PAGE_URL },
	},
	openGraph: {
		type: 'article',
		locale: 'pl_PL',
		url: PAGE_URL,
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		publishedTime: '2026-08-31T08:00:00.000Z',
		modifiedTime: '2026-08-31T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [
			{
				url: IMAGE,
				width: 1200,
				height: 630,
				alt: 'Kalendarz dni wolnych 2027 w Polsce',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Dni wolne 2027 — kalendarz świąt',
		description: '14 świąt ustawowych z Wigilią, dwa w sobotę i mosty w 2027 roku.',
		images: [IMAGE],
	},
	category: 'Urlopy i planowanie',
}

export default function Holidays2027Layout({ children }: { children: React.ReactNode }) {
	return children
}
