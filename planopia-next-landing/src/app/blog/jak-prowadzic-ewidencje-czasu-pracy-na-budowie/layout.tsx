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
	title: 'Jak prowadzić ewidencję czasu pracy na budowie (bez Excela) | Planopia',
	description:
		'Ewidencja czasu pracy na budowie: jak uporządkować godziny, nadgodziny i rozliczenia. System zamiast kartek, zadania (Kanban), czat, raporty PDF/Excel i AI w Planopii.',
	keywords: [
		'ewidencja czasu pracy na budowie',
		'firma budowlana',
		'nadgodziny budowa',
		'Excel ewidencja',
		'Planopia',
		'grafik brygad',
		'Kanban',
		'czat zespołowy',
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
		url: 'https://planopia.pl/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
		siteName: 'Planopia',
		title: 'Jak prowadzić ewidencję czasu pracy na budowie (bez Excela) | Planopia',
		description:
			`Budowa i biuro w jednym systemie. ${blogArticleOfferLine.pl}`,
		images: [
			{
				url: 'https://planopia.pl/img/worktimeblog.webp',
				width: 1200,
				height: 630,
				alt: 'Ewidencja czasu pracy na budowie — Planopia',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Ewidencja czasu pracy na budowie | Planopia',
		description: `Ewidencja na budowie bez Excela. ${blogArticleOfferLine.pl}`,
		images: ['https://planopia.pl/img/worktimeblog.webp'],
	},
	alternates: {
		canonical: 'https://planopia.pl/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
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
	return (
		<div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>{children}</div>
	)
}
