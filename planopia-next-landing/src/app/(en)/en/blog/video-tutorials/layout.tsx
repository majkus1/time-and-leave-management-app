import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'


export const metadata: Metadata = {
	title: {
		absolute: 'Video tutorials — how to use Planopia | Planopia',
	},
	description:
		`Step-by-step videos from the Planopia app, including manual hours in the time log. ${blogArticleOfferLine.en}`,
	keywords: [
		'Planopia tutorial',
		'Planopia help',
		'video tutorial',
		'time tracking tutorial',
		'how to manually add work hours',
		'Planopia guide',
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
		locale: 'en_US',
		url: 'https://planopia.pl/en/blog/video-tutorials',
		siteName: 'Planopia',
		publishedTime: '2026-03-24T12:00:00.000Z',
		modifiedTime: '2026-03-24T12:00:00.000Z',
		authors: ['Michał Lipka'],
		title: 'Video tutorials — how to use Planopia | Planopia',
		description: `Screen recordings: time tracking and more. ${blogArticleOfferLine.en}`,
		images: [
			{
				url: 'https://planopia.pl/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Planopia video tutorials',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Video tutorials — how to use Planopia | Planopia',
		description: `Planopia video guides. ${blogArticleOfferLine.en}`,
		images: ['https://planopia.pl/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/en/blog/video-tutorials',
		languages: {
			pl: 'https://planopia.pl/blog/instrukcja-wideo-planopia',
			en: 'https://planopia.pl/en/blog/video-tutorials',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function ENBlogVideoGuideLayout({ children }: { children: React.ReactNode }) {
	return children
}
