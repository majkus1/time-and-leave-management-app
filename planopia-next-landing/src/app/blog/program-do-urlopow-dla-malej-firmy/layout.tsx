import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'

export const metadata: Metadata = {
	title: {
		absolute: 'Program do urlopów dla małej firmy — jak wybrać (2026) | Planopia',
	},
	description:
		'Jak wybrać program do urlopów dla małej firmy w 2026: kryteria, funkcje, koszt i czy istnieje darmowy program do urlopów. ' +
		blogArticleOfferLine.pl,
	keywords: [
		'program do urlopów dla małej firmy',
		'program do urlopów darmowy',
		'darmowy program do urlopów',
		'aplikacja do urlopów dla małej firmy',
		'program urlopowy',
		'wnioski urlopowe online',
		'jak wybrać program do urlopów',
		'kalendarz urlopowy online',
		'Planopia',
	],
	authors: [{ name: 'Michał Lipka' }],
	creator: 'Michał Lipka',
	publisher: 'Planopia',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL('https://planopia.pl'),
	alternates: {
		canonical: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
	},
	openGraph: {
		title: 'Program do urlopów dla małej firmy — jak wybrać (2026)',
		description: `Kryteria wyboru, funkcje, koszt i darmowy start. ${blogArticleOfferLine.pl}`,
		url: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/plans-urlopnew.webp',
				width: 1200,
				height: 630,
				alt: 'Program do urlopów dla małej firmy — Planopia',
			},
		],
		locale: 'pl_PL',
		type: 'article',
		publishedTime: '2026-05-31T00:00:00.000Z',
		modifiedTime: '2026-05-31T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Program do urlopów dla małej firmy — jak wybrać (2026) | Planopia',
		description: `Kryteria, funkcje i koszt programu urlopowego dla małej firmy. ${blogArticleOfferLine.pl}`,
		images: ['/img/plans-urlopnew.webp'],
		creator: '@planopia',
	},
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
	category: 'technology',
}

export default function BlogProgramUrlopowMalaFirmaLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
