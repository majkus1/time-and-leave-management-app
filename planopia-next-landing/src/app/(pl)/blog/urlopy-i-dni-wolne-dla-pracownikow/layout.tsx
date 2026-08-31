import type { Metadata } from 'next'

// Bez roku: tresc opisuje rodzaje urlopow z KP, wiec nie dezaktualizuje sie w styczniu.
const META_TITLE = 'Jakie urlopy przysługują pracownikowi? Lista | Planopia'
const META_DESCRIPTION =
	'Urlop wypoczynkowy to nie wszystko. Sprawdź, jakie urlopy i dni wolne przysługują pracownikowi: szkoleniowy, okolicznościowy, opiekuńczy i siła wyższa.'
const URL = 'https://planopia.pl/blog/urlopy-i-dni-wolne-dla-pracownikow'
const IMAGE = 'https://planopia.pl/img/urlopy-i-dni-wolne-pracownikow.webp'

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
		publishedTime: '2026-08-18T08:00:00.000Z',
		modifiedTime: '2026-08-18T08:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [{
			url: IMAGE,
			width: 1200,
			height: 630,
			alt: 'Urlopy i dni wolne przysługujące pracownikom — kalendarz i wnioski urlopowe',
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

export default function EmployeeLeaveTypesLayout({ children }: { children: React.ReactNode }) {
	return children
}
