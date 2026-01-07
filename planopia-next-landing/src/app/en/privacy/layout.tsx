import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy - Planopia.pl",
	description: "Read the Privacy Policy for Planopia.pl. Information about personal data processing in the time tracking and leave management application.",
	keywords: [
		"Planopia privacy policy",
		"data protection",
		"GDPR SaaS",
		"B2B application privacy",
		"Planopia privacy",
		"data processing"
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
		url: 'https://planopia.pl/en/privacy',
		siteName: 'Planopia',
		title: 'Privacy Policy - Planopia.pl',
		description: 'Information about personal data processing in Planopia time tracking and leave management application.',
		images: [
			{
				url: 'https://planopia.pl/img/headerimage.png',
				width: 1200,
				height: 630,
				alt: 'Privacy Policy - Planopia.pl',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Privacy Policy - Planopia.pl',
		description: 'Information about personal data processing in Planopia time tracking and leave management application.',
		images: ['https://planopia.pl/img/headerimage.png'],
	},
	alternates: {
		canonical: 'https://planopia.pl/en/privacy',
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

