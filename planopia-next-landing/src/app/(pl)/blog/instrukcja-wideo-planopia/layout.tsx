import type { Metadata } from 'next'

const META_DESCRIPTION =
	'Filmy krok po kroku pokazujące obsługę Planopii, w tym ręczne dodawanie godzin. Oglądaj instrukcje na telefonie lub komputerze.'


export const metadata: Metadata = {
	title: {
		absolute: 'Instrukcja wideo — jak korzystać z Planopii | Planopia',
	},
	description: META_DESCRIPTION,
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
		publishedTime: '2026-03-24T12:00:00.000Z',
		modifiedTime: '2026-03-24T12:00:00.000Z',
		authors: ['Michał Lipka'],
		title: 'Instrukcja wideo — jak korzystać z Planopii | Planopia',
		description: META_DESCRIPTION,
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
		description: META_DESCRIPTION,
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
	return children
}
