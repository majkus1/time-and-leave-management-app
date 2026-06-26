import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service - Planopia.pl",
	description: "Read the Terms of Service for Planopia.pl. Terms and conditions for using the time tracking and leave management application.",
	keywords: [
		"Planopia terms",
		"SaaS terms of service",
		"B2B application terms",
		"Planopia conditions",
		"SaaS agreement",
		"usage terms"
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
		url: 'https://planopia.pl/en/terms',
		siteName: 'Planopia',
		title: 'Terms of Service - Planopia.pl',
		description: 'Terms and conditions for using Planopia time tracking and leave management application.',
		images: [
			{
				url: 'https://planopia.pl/img/headerimage.png',
				width: 1200,
				height: 630,
				alt: 'Terms of Service - Planopia.pl',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Terms of Service - Planopia.pl',
		description: 'Terms and conditions for using Planopia time tracking and leave management application.',
		images: ['https://planopia.pl/img/headerimage.png'],
	},
	alternates: {
		canonical: 'https://planopia.pl/en/terms',
		languages: {
			'pl': 'https://planopia.pl/terms',
			'en': 'https://planopia.pl/en/terms',
		},
	},
};

export default function TermsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

