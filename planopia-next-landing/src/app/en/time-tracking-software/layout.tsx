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
	title: 'Time tracking software — online, free tier | Planopia',
	description:
		'Time tracking software online: hours, overtime, monthly calendar, and PDF/Excel reports. 30-day full trial, then free time tracking for up to 5 accounts.',
	keywords: [
		'time tracking software',
		'timesheet software',
		'employee time tracking',
		'work hours tracker',
		'online time tracking',
		'free time tracking',
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
		url: '/en/time-tracking-software',
		siteName: 'Planopia',
		title: 'Time tracking software — online, free tier | Planopia',
		description:
			'Hours, overtime, monthly calendar, and PDF/Excel reports in one app. 30-day full trial, then free time tracking for up to 5 accounts.',
		images: [
			{
				url: '/img/desktop-ennews.webp',
				width: 1200,
				height: 630,
				alt: 'Planopia time tracking software — calendar and reports',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Time tracking software — Planopia',
		description: 'Hours, overtime, and PDF/Excel reports online. 30-day full trial, then free time tracking for up to 5 accounts.',
		images: ['/img/desktop-ennews.webp'],
	},
	alternates: {
		canonical: '/en/time-tracking-software',
		languages: {
			'x-default': '/program-do-ewidencji-czasu-pracy',
			pl: '/program-do-ewidencji-czasu-pracy',
			en: '/en/time-tracking-software',
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
