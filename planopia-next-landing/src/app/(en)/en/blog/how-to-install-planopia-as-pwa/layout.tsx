import type { Metadata } from "next";
import { blogArticleOfferLine } from "@/data/planOfferingCopy";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "How to Install Planopia as a PWA App? Installation Guide | Planopia",
  },
  description: `Learn how to install Planopia as a PWA on iPhone, iPad, Android, and desktop browsers such as Chrome. Add time tracking and leave tools to your home screen or desktop. ${blogArticleOfferLine.en}`,
  keywords: [
    "PWA installation",
    "how to install PWA",
    "PWA mobile app",
    "Planopia PWA",
    "install mobile app",
    "Progressive Web App",
    "time tracking app",
    "mobile leave management",
    "mobile Planopia",
    "PWA step by step"
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
    type: 'article',
    locale: 'en_US',
    url: 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
    siteName: 'Planopia',
    publishedTime: '2025-01-15T12:00:00.000Z',
    modifiedTime: '2025-01-15T12:00:00.000Z',
    authors: ['Michał Lipka'],
    title: 'How to Install Planopia as a PWA App? Installation Guide | Planopia',
    description: `Planopia PWA on phone and desktop. ${blogArticleOfferLine.en}`,
    images: [
      {
        url: 'https://planopia.pl/img/pwa1.png',
        width: 1200,
        height: 630,
        alt: 'Installing Planopia as PWA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Install Planopia as a PWA App? Installation Guide | Planopia',
    description: `Planopia PWA on phone and desktop. ${blogArticleOfferLine.en}`,
    images: ['https://planopia.pl/img/pwa1.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
    languages: {
      'pl': 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
      'en': 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
};

export default function ENBlogPWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
