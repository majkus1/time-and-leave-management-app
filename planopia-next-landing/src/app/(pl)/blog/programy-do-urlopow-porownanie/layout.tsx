import type { Metadata } from 'next'

const META_TITLE = 'Programy do urlopów dla firm — porównanie | Planopia'
const META_DESCRIPTION =
	'Porównanie 7 programów do urlopów: ceny, okresy próbne, wieloetapowa akceptacja, pula dni, urlop w godzinach i plan urlopów. Dane ze stron dostawców.'
const PAGE_URL = 'https://planopia.pl/blog/programy-do-urlopow-porownanie'
const IMAGE = 'https://planopia.pl/img/og/urlopy.jpg'

export const metadata: Metadata = {
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
		publishedTime: '2026-10-17T08:00:00.000Z',
		modifiedTime: '2026-10-17T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [
			{
				url: IMAGE,
				width: 1200,
				height: 630,
				alt: 'Urlopy i wnioski urlopowe w aplikacji Planopia',
				type: 'image/jpeg',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Programy do urlopów dla firm — porównanie 2026',
		description: 'Ceny, okresy próbne, akceptacja wniosków, pula dni i urlop w godzinach — siedem programów, dane ze stron dostawców.',
		images: [IMAGE],
	},
	category: 'Urlopy i planowanie',
}

export default function LeaveComparisonLayout({ children }: { children: React.ReactNode }) {
	return children
}
