import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Data Processing Agreement (DPA) - Planopia.pl",
	description: "Read the Data Processing Agreement (DPA) for Planopia.pl. Terms for data processing by Planopia as a processor.",
	keywords: [
		"Planopia DPA",
		"data processing agreement",
		"GDPR processor",
		"Planopia data processing",
		"B2B data processing"
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
		locale: 'en_US',
		url: 'https://planopia.pl/en/dpa',
		siteName: 'Planopia',
		title: 'Data Processing Agreement (DPA) - Planopia.pl',
		description: 'Terms for personal data processing by Planopia as a processor in service provision.',
		images: [
			{
				url: 'https://planopia.pl/img/headerimage.png',
				width: 1200,
				height: 630,
				alt: 'Data Processing Agreement - Planopia.pl',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Data Processing Agreement (DPA) - Planopia.pl',
		description: 'Terms for personal data processing by Planopia as a processor in service provision.',
		images: ['https://planopia.pl/img/headerimage.png'],
	},
	alternates: {
		canonical: 'https://planopia.pl/en/dpa',
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

