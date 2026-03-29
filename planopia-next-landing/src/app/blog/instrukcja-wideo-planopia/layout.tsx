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
	title: 'Instrukcja wideo — jak korzystać z Planopii | Planopia',
	description:
		'Filmy krok po kroku: m.in. ręczne dodawanie godzin w ewidencji czasu pracy. Poradniki wideo do aplikacji Planopia — wygodnie na telefonie i komputerze.',
	keywords: [
		'Planopia instrukcja',
		'poradnik Planopia',
		'instrukcja wideo',
		'ewidencja czasu pracy tutorial',
		'jak ręcznie dodać godziny pracy',
		'Planopia pomoc',
		'aplikacja PWA tutorial',
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
		locale: 'pl_PL',
		url: 'https://planopia.pl/blog/instrukcja-wideo-planopia',
		siteName: 'Planopia',
		title: 'Instrukcja wideo — jak korzystać z Planopii | Planopia',
		description:
			`Wideo z aplikacji: ewidencja i inne moduły. ${blogArticleOfferLine.pl}`,
		images: [
			{
				url: 'https://planopia.pl/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Instrukcja wideo Planopia',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Instrukcja wideo — jak korzystać z Planopii | Planopia',
		description:
			`Tutoriale Planopii — m.in. godziny w ewidencji. ${blogArticleOfferLine.pl}`,
		images: ['https://planopia.pl/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/blog/instrukcja-wideo-planopia',
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

export default function BlogVideoGuideLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>{children}</div>
	)
}
