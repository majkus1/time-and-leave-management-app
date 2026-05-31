import type { Metadata } from 'next'
import { Open_Sans, Teko, Titillium_Web } from 'next/font/google'
import '../../globals.css'

const openSans = Open_Sans({
	variable: '--font-open-sans',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700', '800'],
})

const teko = Teko({
	variable: '--font-teko',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
})

const titilliumWeb = Titillium_Web({
	variable: '--font-titillium-web',
	subsets: ['latin'],
	weight: ['200', '300', '400', '600', '700', '900'],
})

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: 'Leave management software — requests, calendar, approvals | Planopia',
	description:
		'Leave management software: online leave requests, approvals, and a team absence calendar. 30-day full trial free, then a plan with leave from 119 PLN net/month.',
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
		title: 'Leave management software — requests, calendar, approvals | Planopia',
		description:
			'Online leave requests, approvals, and a team leave calendar in one app. 30-day full trial free, then a plan with leave from 119 PLN net/month.',
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
		title: 'Leave management software — Planopia',
		description: 'Online leave requests, approvals, and a team leave calendar. 30-day full trial free.',
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
	return <div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>{children}</div>
}
