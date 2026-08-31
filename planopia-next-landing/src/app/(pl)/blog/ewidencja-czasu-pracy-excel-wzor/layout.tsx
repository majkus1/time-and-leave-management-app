import type { Metadata } from 'next'

const META_TITLE = 'Ewidencja czasu pracy Excel — darmowy wzór | Planopia'
const META_DESCRIPTION =
	'Pobierz darmowy wzór ewidencji czasu pracy w Excelu i PDF. Karta zgodna z rozporządzeniem, automatyczne liczenie godzin, nadgodzin i nieobecności.'
const URL = 'https://planopia.pl/blog/ewidencja-czasu-pracy-excel-wzor'
const IMAGE = 'https://planopia.pl/img/ewidencja-czasu-pracy-excel-wzor.webp'

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
		publishedTime: '2026-08-19T10:00:00.000Z',
		modifiedTime: '2026-08-19T10:00:00.000Z',
		authors: ['Michał Lipka'],
		images: [{
			url: IMAGE,
			width: 1200,
			height: 630,
			alt: 'Wzór karty ewidencji czasu pracy w Excelu i PDF',
		}],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [IMAGE],
	},
	category: 'Ewidencja czasu pracy',
}

export default function TimesheetExcelLayout({ children }: { children: React.ReactNode }) {
	return children
}
