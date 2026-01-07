import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Polityka prywatności Planopia.pl",
	description: "Zapoznaj się z Polityką prywatności Planopia.pl. Informacje o przetwarzaniu danych osobowych w aplikacji do ewidencji czasu pracy i urlopów.",
	keywords: [
		"polityka prywatności Planopia",
		"ochrona danych osobowych",
		"RODO SaaS",
		"prywatność aplikacji B2B",
		"Planopia privacy",
		"przetwarzanie danych"
	],
	authors: [{ name: "Michał Lipka" }],
	creator: "Michał Lipka",
	publisher: "Planopia",
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
		type: 'website',
		locale: 'pl_PL',
		url: 'https://planopia.pl/privacy',
		siteName: 'Planopia',
		title: 'Polityka prywatności Planopia.pl',
		description: 'Informacje o przetwarzaniu danych osobowych w aplikacji Planopia do zarządzania czasem pracy i urlopami.',
		images: [
			{
				url: 'https://planopia.pl/img/headerimage.png',
				width: 1200,
				height: 630,
				alt: 'Polityka prywatności Planopia.pl',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Polityka prywatności Planopia.pl',
		description: 'Informacje o przetwarzaniu danych osobowych w aplikacji Planopia do zarządzania czasem pracy i urlopami.',
		images: ['https://planopia.pl/img/headerimage.png'],
	},
	alternates: {
		canonical: 'https://planopia.pl/privacy',
		languages: {
			'pl': 'https://planopia.pl/privacy',
			'en': 'https://planopia.pl/en/privacy',
		},
	},
};

export default function PrivacyLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
