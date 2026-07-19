import type { Metadata } from "next";
import "@/app/globals.css";

const META_TITLE = "Jak zainstalować Planopię jako PWA? | Planopia";
const META_DESCRIPTION =
  "Zainstaluj Planopię jako PWA na iPhonie, Androidzie lub komputerze. Instrukcja krok po kroku dla Safari, Chrome i Edge.";

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    "PWA instalacja",
    "jak zainstalować PWA",
    "aplikacja PWA mobilna",
    "Planopia PWA",
    "instalacja aplikacji mobilnej",
    "Progressive Web App",
    "aplikacja do ewidencji czasu pracy",
    "zarządzanie urlopami mobilne",
    "Planopia mobilna",
    "PWA krok po kroku"
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
    locale: 'pl_PL',
    url: 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
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
        alt: 'Instalacja Planopii jako PWA',
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
    canonical: 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
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

export default function BlogPWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
