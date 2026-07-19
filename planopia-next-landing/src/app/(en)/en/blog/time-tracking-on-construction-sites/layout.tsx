import type { Metadata } from 'next'

const META_TITLE = 'Construction Time Tracking Guide | Planopia'
const META_DESCRIPTION =
	'Organize crew hours, overtime, tasks, and PDF/Excel reports in one system. A practical time tracking guide for construction teams.'


export const metadata: Metadata = {
	title: {
		absolute: META_TITLE,
	},
	description: META_DESCRIPTION,
	keywords: [
		'construction time tracking',
		'building company',
		'jobsite hours',
		'spreadsheet time tracking',
		'Planopia',
		'crew schedule',
		'Kanban',
		'team chat',
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
		type: 'article',
		locale: 'en_US',
		url: 'https://planopia.pl/en/blog/time-tracking-on-construction-sites',
		siteName: 'Planopia',
		publishedTime: '2026-03-24T12:00:00.000Z',
		modifiedTime: '2026-03-24T12:00:00.000Z',
		authors: ['Michał Lipka'],
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: [
			{
				url: 'https://planopia.pl/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Construction time tracking — Planopia',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: ['https://planopia.pl/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/en/blog/time-tracking-on-construction-sites',
		languages: {
			pl: 'https://planopia.pl/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
			en: 'https://planopia.pl/en/blog/time-tracking-on-construction-sites',
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
