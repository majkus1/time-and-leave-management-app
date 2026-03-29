import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'
import { Open_Sans, Teko, Titillium_Web } from 'next/font/google'
import '../../../globals.css'

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
	title: 'Video tutorials — how to use Planopia | Planopia',
	description:
		`Step-by-step videos from the Planopia app, including manual hours in the time log. ${blogArticleOfferLine.en}`,
	keywords: [
		'Planopia tutorial',
		'Planopia help',
		'video tutorial',
		'time tracking tutorial',
		'how to manually add work hours',
		'Planopia guide',
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
		url: 'https://planopia.pl/en/blog/video-tutorials',
		siteName: 'Planopia',
		title: 'Video tutorials — how to use Planopia | Planopia',
		description: `Screen recordings: time tracking and more. ${blogArticleOfferLine.en}`,
		images: [
			{
				url: 'https://planopia.pl/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Planopia video tutorials',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Video tutorials — how to use Planopia | Planopia',
		description: `Planopia video guides. ${blogArticleOfferLine.en}`,
		images: ['https://planopia.pl/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/en/blog/video-tutorials',
		languages: {
			pl: 'https://planopia.pl/blog/instrukcja-wideo-planopia',
			en: 'https://planopia.pl/en/blog/video-tutorials',
		},
	},
	verification: {
		google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
	},
	category: 'technology',
}

export default function ENBlogVideoGuideLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>{children}</div>
	)
}
