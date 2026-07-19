import type { Metadata } from 'next'

const META_TITLE = 'Leave Management Software for Teams | Planopia'
const META_DESCRIPTION =
	'Learn how leave management software organizes requests, approvals, balances, and the team absence calendar without spreadsheets.'

export const metadata: Metadata = {
	title: {
		absolute: META_TITLE,
	},
	description: META_DESCRIPTION,
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
		title: META_TITLE,
		description: META_DESCRIPTION,
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
		title: META_TITLE,
		description: META_DESCRIPTION,
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
