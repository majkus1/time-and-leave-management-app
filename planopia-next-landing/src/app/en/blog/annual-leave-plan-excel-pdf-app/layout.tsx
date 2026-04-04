import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'

export const metadata: Metadata = {
	title: 'Annual leave plan: Excel, PDF & leave request app — 2026 guide | Planopia',
	description: `Annual leave in Excel or PDF vs leave request software: spreadsheet limits, overtime tracking, small-team HR. ${blogArticleOfferLine.en}`,
	keywords: [
		'annual leave plan excel',
		'leave calendar pdf',
		'leave request software',
		'vacation planning spreadsheet',
		'HR leave app small business',
		'overtime tracking software',
		'leave management',
		'Planopia',
		'excel vs leave app',
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
		canonical: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		languages: {
			'pl-PL': '/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
			'en-US': '/en/blog/annual-leave-plan-excel-pdf-app',
		},
	},
	openGraph: {
		title: 'Annual leave plan: Excel, PDF, and an app | Planopia',
		description: `Checklist for leave workflows and when to move off spreadsheets. ${blogArticleOfferLine.en}`,
		url: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/roczny-plan.webp',
				width: 1200,
				height: 630,
				alt: 'Leave planning and requests in Planopia',
			},
		],
		locale: 'en_US',
		type: 'article',
		publishedTime: '2026-03-27T00:00:00.000Z',
		modifiedTime: '2026-03-27T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Annual leave plan: Excel, PDF, or an app? | Planopia',
		description: `Practical checklist for teams. ${blogArticleOfferLine.en}`,
		images: ['/img/roczny-plan.webp'],
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

export default function ENBlogLeavePlanExcelLayout({ children }: { children: React.ReactNode }) {
	return children
}
