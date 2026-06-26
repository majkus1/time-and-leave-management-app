import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'


export const metadata: Metadata = {
	title: {
		absolute: 'How to track time on construction sites (without spreadsheets) | Planopia',
	},
	description:
		'Construction time tracking: how to organize hours, overtime, and reporting. One system instead of paper, with Kanban, chat, PDF/Excel exports, and AI in Planopia.',
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
		title: 'How to track time on construction sites (without spreadsheets) | Planopia',
		description: `Site and office in one system. ${blogArticleOfferLine.en}`,
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
		title: 'Time tracking on construction sites | Planopia',
		description: `Jobsite hours without spreadsheets. ${blogArticleOfferLine.en}`,
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
