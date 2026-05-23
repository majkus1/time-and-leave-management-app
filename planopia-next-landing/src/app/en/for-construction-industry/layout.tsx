import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'
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
	title: 'Construction time tracking & crew scheduling',
	description: `Planopia for construction: crew time tracking, no-access field workers, schedules, leave, Kanban, team chat, PDF/Excel from site. ${blogArticleOfferLine.en}`,
	keywords: [
		'construction time tracking',
		'foreman time tracking',
		'crew payroll software',
		'construction worker timesheet',
		'jobsite time reporting',
		'building company software',
		'crew scheduling',
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
		url: '/en/for-construction-industry',
		siteName: 'Planopia',
		title: 'Construction time tracking & crew scheduling | Planopia',
		description: `One app for crews and office. ${blogArticleOfferLine.en}`,
		images: [
			{
				url: '/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Planopia — construction time tracking',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Construction time tracking | Planopia',
		description: `Crew schedules, leave, tasks, chat. ${blogArticleOfferLine.en}`,
		images: ['/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: '/en/for-construction-industry',
		languages: {
			'x-default': '/dla-branzy-budowlanej',
			pl: '/dla-branzy-budowlanej',
			en: '/en/for-construction-industry',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>{children}</div>
	)
}
