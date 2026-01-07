import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Regulamin świadczenia usługi Planopia.pl",
	description: "Zapoznaj się z Regulaminem świadczenia usługi Planopia.pl. Warunki korzystania z aplikacji do ewidencji czasu pracy i urlopów.",
	keywords: [
		"regulamin Planopia",
		"warunki usługi SaaS",
		"regulamin aplikacji B2B",
		"Planopia terms",
		"umowa SaaS",
		"zasady korzystania"
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
		url: 'https://planopia.pl/terms',
		siteName: 'Planopia',
		title: 'Regulamin świadczenia usługi Planopia.pl',
		description: 'Warunki korzystania z aplikacji Planopia do zarządzania czasem pracy i urlopami.',
		images: [
			{
				url: 'https://planopia.pl/img/headerimage.png',
				width: 1200,
				height: 630,
				alt: 'Regulamin Planopia.pl',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Regulamin świadczenia usługi Planopia.pl',
		description: 'Warunki korzystania z aplikacji Planopia do zarządzania czasem pracy i urlopami.',
		images: ['https://planopia.pl/img/headerimage.png'],
	},
	alternates: {
		canonical: 'https://planopia.pl/terms',
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
