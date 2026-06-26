import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'

export const metadata: Metadata = {
	title: {
		absolute: 'Leave management — software, system & vacation app | Planopia',
	},
	description: `Leave management software: requests, calendar, approvals without spreadsheet chaos. ${blogArticleOfferLine.en}`,
	keywords: [
		'leave management',
		'leave management software',
		'vacation management',
		'leave management in company',
		'leave system',
		'vacation planning',
		'leave tracking',
		'leave requests',
		'Planopia',
		'company leave',
		'automated leave',
		'absence management'
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
		canonical: 'https://planopia.pl/en/blog/leave-management',
		languages: {
			pl: 'https://planopia.pl/blog/zarzadzanie-urlopami',
			en: 'https://planopia.pl/en/blog/leave-management',
		},
	},
	openGraph: {
		title: 'Leave management — vacation system & software | Planopia',
		description: `Leave app with requests and approvals in one tool. ${blogArticleOfferLine.en}`,
		url: 'https://planopia.pl/en/blog/leave-management',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/desktop.png',
				width: 1200,
				height: 630,
				alt: 'Leave Management in a Company - Planopia',
			},
		],
		locale: 'en_US',
		type: 'article',
		publishedTime: '2024-10-25T00:00:00.000Z',
		modifiedTime: '2026-03-27T12:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Leave management — software for teams | Planopia',
		description: `Vacation system instead of scattered sheets — Planopia. ${blogArticleOfferLine.en}`,
		images: ['/img/desktop.png'],
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

export default function ENBlogSixLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
