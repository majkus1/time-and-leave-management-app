import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Umowa powierzenia przetwarzania danych (DPA) Planopia.pl",
	description: "Zapoznaj się z Umową powierzenia przetwarzania danych osobowych (DPA) Planopia.pl. Warunki przetwarzania danych przez Planopię jako procesora.",
	keywords: [
		"DPA Planopia",
		"umowa powierzenia danych",
		"RODO procesor",
		"Planopia DPA",
		"przetwarzanie danych osobowych B2B"
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
		url: 'https://planopia.pl/dpa',
		siteName: 'Planopia',
		title: 'Umowa powierzenia przetwarzania danych (DPA) Planopia.pl',
		description: 'Warunki przetwarzania danych osobowych przez Planopię jako procesora w ramach świadczenia usługi.',
		images: [
			{
				url: 'https://planopia.pl/img/headerimage.png',
				width: 1200,
				height: 630,
				alt: 'Umowa powierzenia przetwarzania danych Planopia.pl',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Umowa powierzenia przetwarzania danych (DPA) Planopia.pl',
		description: 'Warunki przetwarzania danych osobowych przez Planopię jako procesora w ramach świadczenia usługi.',
		images: ['https://planopia.pl/img/headerimage.png'],
	},
	alternates: {
		canonical: 'https://planopia.pl/dpa',
		languages: {
			'pl': 'https://planopia.pl/dpa',
			'en': 'https://planopia.pl/en/dpa',
		},
	},
};

export default function DpaLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
