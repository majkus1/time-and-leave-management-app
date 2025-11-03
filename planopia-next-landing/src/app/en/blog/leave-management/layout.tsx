import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Leave Management in a Company - Complete Guide | Planopia',
	description: 'Complete guide to leave management in a company. Learn how to effectively plan, track, and approve leave requests. Planopia - free leave management software.',
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
			'pl-PL': '/blog/zarzadzanie-urlopami',
			'en-US': '/en/blog/leave-management',
		},
	},
	openGraph: {
		title: 'Leave Management in a Company - Complete Guide | Planopia',
		description: 'Complete guide to leave management in a company. Learn how to effectively plan, track, and approve leave requests.',
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
		modifiedTime: '2024-10-25T00:00:00.000Z',
		authors: ['Michał Lipka'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Leave Management in a Company - Complete Guide | Planopia',
		description: 'Complete guide to leave management in a company. Learn how to effectively plan, track, and approve leave requests.',
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
