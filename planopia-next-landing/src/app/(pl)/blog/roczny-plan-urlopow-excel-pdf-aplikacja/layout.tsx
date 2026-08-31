import type { Metadata } from 'next'

const META_TITLE = 'Roczny plan urlopów: Excel, PDF czy aplikacja | Planopia'
const META_DESCRIPTION =
	'Porównanie rocznego planu urlopów w Excelu i PDF z aplikacją do wniosków i akceptacji. Checklista wyboru i darmowy wzór arkusza do pobrania.'


export const metadata: Metadata = {
	title: {
		absolute: META_TITLE,
	},
	description: META_DESCRIPTION,
	keywords: [
		'roczny plan urlopów excel',
		'plan urlopów pdf',
		'excel czy program do urlopów',
		'program do wniosków urlopowych',
		'program kadrowy urlopy',
		'oprogramowanie do ewidencji nadgodzin',
		'zarządzanie urlopami',
		'planowanie urlopów',
		'Planopia',
		'aplikacja urlopowa',
		'excel vs program urlopy',
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
		type: 'article',
		locale: 'pl_PL',
		url: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
		siteName: 'Planopia',
		publishedTime: '2026-03-27T12:00:00.000Z',
		modifiedTime: '2026-08-31T12:00:00.000Z',
		authors: ['Michał Lipka'],
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [
			{
				url: 'https://planopia.pl/img/roczny-plan.webp',
				width: 1200,
				height: 630,
				alt: 'Plan urlopów i wnioski urlopowe w Planopii',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: ['https://planopia.pl/img/roczny-plan.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
		languages: {
			pl: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
			en: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function BlogLeavePlanExcelPlLayout({ children }: { children: React.ReactNode }) {
	return children
}
