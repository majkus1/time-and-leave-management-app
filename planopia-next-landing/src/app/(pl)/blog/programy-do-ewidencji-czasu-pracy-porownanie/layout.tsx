import type { Metadata } from 'next'

const META_TITLE = 'Programy do ewidencji czasu pracy — porównanie | Planopia'
const META_DESCRIPTION =
	'Porównanie 6 programów do ewidencji czasu pracy: darmowe plany, okresy próbne, ceny za osobę i za zespół, urlopy, grafiki i QR. Dane z cenników.'
const PAGE_URL = 'https://planopia.pl/blog/programy-do-ewidencji-czasu-pracy-porownanie'
const IMAGE = 'https://planopia.pl/img/og/ewidencja-czasu-pracy.jpg'

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
				alt: 'Ewidencja czasu pracy w aplikacji Planopia',
				type: 'image/jpeg',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Programy do ewidencji czasu pracy — porównanie 2026',
		description: 'Darmowe plany, okresy próbne, ceny za osobę i za zespół, urlopy i grafiki — sześć programów, dane z cenników.',
		images: [IMAGE],
	},
	category: 'Ewidencja czasu pracy',
}

export default function TimeTrackingComparisonLayout({ children }: { children: React.ReactNode }) {
	return children
}
