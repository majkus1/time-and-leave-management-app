import type { Metadata } from 'next'

const META_TITLE = 'Construction time tracking & crew scheduling | Planopia'
const META_DESCRIPTION =
	'Track crew hours, schedules, leave, tasks, and site reports in one app. Built for construction teams working across office and field.'


export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
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
		title: META_TITLE,
		description: META_DESCRIPTION,
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
		title: META_TITLE,
		description: META_DESCRIPTION,
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
	return children
}
