import type { Metadata } from 'next'
import { blogArticleOfferLine } from '@/data/planOfferingCopy'


export const metadata: Metadata = {
	title: {
		absolute: 'Jak prowadzić ewidencję czasu pracy na budowie (bez Excela) | Planopia',
	},
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
		publishedTime: '2026-03-24T12:00:00.000Z',
		modifiedTime: '2026-03-24T12:00:00.000Z',
		authors: ['Michał Lipka'],
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
	return children
}
