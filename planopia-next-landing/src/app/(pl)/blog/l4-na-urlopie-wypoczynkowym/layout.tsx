import type { Metadata } from 'next'

const META_TITLE = 'L4 na urlopie wypoczynkowym: co z urlopem? | Planopia'
const META_DESCRIPTION =
	'L4 podczas urlopu wypoczynkowego przerywa urlop. Sprawdź, jak odzyskać niewykorzystane dni, zgłosić chorobę i postąpić po powrocie do pracy.'
const URL = 'https://planopia.pl/blog/l4-na-urlopie-wypoczynkowym'
const IMAGE = 'https://planopia.pl/img/l4-na-urlopie-wypoczynkowym.webp'

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
		publishedTime: '2026-08-03T08:00:00.000Z',
		modifiedTime: '2026-08-31T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [{
			url: IMAGE,
			width: 1200,
			height: 630,
			alt: 'Kalendarz urlopowy pokazujący przerwanie urlopu przez zwolnienie lekarskie',
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

export default function SickLeaveDuringVacationLayout({ children }: { children: React.ReactNode }) {
	return children
}
