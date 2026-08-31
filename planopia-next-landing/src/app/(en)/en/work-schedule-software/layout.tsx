import type { Metadata } from 'next'

const META_TITLE = 'Work schedule software for teams | Planopia'
const META_DESCRIPTION =
	'Build team work schedules online: shifts, minimum staffing, and automatic fill that skips leave and public holidays. 30 days free, no card needed.'
const IMAGE = '/img/aigrafik-en.webp'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'work schedule software',
		'employee scheduling software',
		'shift scheduling app',
		'work roster software',
		'staff scheduling online',
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
		url: '/en/work-schedule-software',
		siteName: 'Planopia',
		title: META_TITLE,
		description:
			'Plan shift rosters for the whole team in one place. Automatic fill skips leave, public holidays, and weekends. 30 days of the full app for free.',
		images: [
			{
				url: IMAGE,
				width: 1895,
				height: 910,
				alt: 'Planopia work schedule software — team roster',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Work schedule software — Planopia',
		description: 'Shift rosters online with automatic fill. 30 days of the full app for free.',
		images: [IMAGE],
	},
	alternates: {
		canonical: '/en/work-schedule-software',
		languages: {
			'x-default': '/program-do-grafikow-pracy',
			pl: '/program-do-grafikow-pracy',
			en: '/en/work-schedule-software',
		},
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
