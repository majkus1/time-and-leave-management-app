import type { Metadata } from 'next'

const META_TITLE = 'How to use Planopia — user guide | Planopia'
const META_DESCRIPTION =
	'A step-by-step guide to Planopia: time records, leave requests, schedules, tasks, team settings, and reports for admins and HR.'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'how to use Planopia',
		'Planopia user guide',
		'time tracking app guide',
		'how to request leave',
		'Planopia help',
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
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	alternates: {
		canonical: '/en/how-to-use',
		languages: {
			'x-default': '/jak-korzystac',
			pl: '/jak-korzystac',
			en: '/en/how-to-use',
		},
	},
	openGraph: {
		type: 'article',
		locale: 'en_US',
		alternateLocale: ['pl_PL'],
		url: '/en/how-to-use',
		siteName: 'Planopia',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [
			{
				url: '/img/headerimage.png',
				width: 1024,
				height: 722,
				alt: 'Planopia — ewidencja czasu pracy, urlopy i grafiki',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'How to use Planopia',
		description: 'Step-by-step: time records, leave, schedules, tasks, and team settings.',
		images: ['/img/headerimage.png'],
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
