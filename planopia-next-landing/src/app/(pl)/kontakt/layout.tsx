import type { Metadata } from 'next'

const META_TITLE = 'Kontakt: umów rozmowę o wdrożeniu | Planopia'
const META_DESCRIPTION =
	'Napisz, zadzwoń albo umów rozmowę online o wdrożeniu Planopii. Odpowiadamy na pytania o ewidencję czasu pracy, urlopy i grafiki dla Twojego zespołu.'
const URL = 'https://planopia.pl/kontakt'

export const metadata: Metadata = {
	title: { absolute: META_TITLE },
	description: META_DESCRIPTION,
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
	// Strona istnieje tylko po polsku — wersja EN ma sekcje kontaktu na stronie glownej.
	alternates: {
		canonical: '/kontakt',
		languages: {
			'x-default': '/kontakt',
			pl: '/kontakt',
		},
	},
	// openGraph nie jest scalany z layoutem rodzica, tylko podmieniany w calosci —
	// bez jawnego `images` link do /kontakt trafia na LinkedIn czy Slacka bez grafiki.
	openGraph: {
		type: 'website',
		locale: 'pl_PL',
		url: URL,
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
		title: META_TITLE,
		description: META_DESCRIPTION,
		images: ['/img/headerimage.png'],
	},
}

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
	return children
}
