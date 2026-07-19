import type { Metadata } from "next";

const META_TITLE = "How to Install Planopia as a PWA | Planopia";
const META_DESCRIPTION =
  "Install Planopia as a PWA on iPhone, Android, or desktop. Follow the step-by-step guide for Safari, Chrome, and Edge.";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
