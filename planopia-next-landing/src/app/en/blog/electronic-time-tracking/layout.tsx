import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Electronic Time Tracking - Complete Guide | Planopia',
	description: 'Complete guide to electronic time tracking. Learn how to choose the best time tracking software for your company. Planopia - free time tracking app.',
	keywords: [
		'electronic time tracking',
		'time tracking software',
		'online time tracking',
		'time tracking application',
		'time registration software',
		'work time management',
		'free time tracking',
		'Planopia',
		'time tracking program',
		'electronic time tracking',
		'leave management software',
		'leave application'
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
		canonical: '/en/blog/electronic-time-tracking',
		languages: {
			'pl-PL': '/blog/elektroniczna-ewidencja-czasu-pracy',
			'en-US': '/en/blog/electronic-time-tracking',
		},
	},
	openGraph: {
		title: 'Electronic Time Tracking - Complete Guide | Planopia',
		description: 'Complete guide to electronic time tracking. Learn how to choose the best time tracking software for your company.',
		url: 'https://planopia.pl/en/blog/electronic-time-tracking',
		siteName: 'Planopia',
		images: [
			{
				url: '/img/desktop.png',
				width: 1200,
				height: 630,
				alt: 'Electronic Time Tracking - Planopia',
			},
		],
		locale: 'en_US',
		type: 'article',
		publishedTime: '2024-10-18T00:00:00.000Z',
		modifiedTime: '2024-10-18T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Electronic Time Tracking - Complete Guide | Planopia',
		description: 'Complete guide to electronic time tracking. Learn how to choose the best time tracking software for your company.',
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

export default function ENBlogFiveLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return children
}
