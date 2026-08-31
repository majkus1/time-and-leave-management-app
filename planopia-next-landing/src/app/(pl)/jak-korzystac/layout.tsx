import type { Metadata } from 'next'

const META_TITLE = 'Jak korzystać z Planopii — instrukcja | Planopia'
const META_DESCRIPTION =
	'Instrukcja obsługi Planopii krok po kroku: ewidencja czasu pracy, wnioski urlopowe, grafiki, zadania, ustawienia zespołu i raporty.'

export const metadata: Metadata = {
	metadataBase: new URL('https://planopia.pl'),
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
	keywords: [
		'jak korzystać z Planopii',
		'instrukcja Planopia',
		'instrukcja obsługi ewidencji czasu pracy',
		'jak dodać godziny pracy',
		'jak złożyć wniosek urlopowy',
		'Planopia pomoc',
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
		canonical: '/jak-korzystac',
		languages: {
			'x-default': '/jak-korzystac',
			pl: '/jak-korzystac',
			en: '/en/how-to-use',
		},
	},
	openGraph: {
		type: 'article',
		locale: 'pl_PL',
		alternateLocale: ['en_US'],
		url: '/jak-korzystac',
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
		title: 'Jak korzystać z Planopii',
		description: 'Instrukcja krok po kroku: czas pracy, urlopy, grafiki, zadania i ustawienia zespołu.',
		images: ['/img/headerimage.png'],
	},
	category: 'technology',
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children
}
