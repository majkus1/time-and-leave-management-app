import type { Metadata } from 'next'

const META_TITLE = 'Leave Management: Requests and Calendar | Planopia'
const META_DESCRIPTION =
	'Manage leave requests, approvals, and the team absence calendar online. Start with a 30-day full trial and keep HR workflows in one place.'


export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'leave management software',
		'leave request software',
		'employee leave app',
		'time off management',
		'absence management',
		'vacation tracker',
		'Planopia',
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
		type: 'website',
		locale: 'en_US',
		alternateLocale: ['pl_PL'],
		url: '/en/leave-management-software',
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [
			{
				url: '/img/plans-urlopnewen.webp',
				width: 1200,
				height: 630,
				alt: 'Planopia leave management software — calendar and requests',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: ['/img/plans-urlopnewen.webp'],
	},
	alternates: {
		canonical: '/en/leave-management-software',
		languages: {
			'x-default': '/program-do-urlopow',
			pl: '/program-do-urlopow',
			en: '/en/leave-management-software',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
