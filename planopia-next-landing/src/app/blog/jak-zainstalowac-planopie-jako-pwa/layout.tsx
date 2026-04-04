import type { Metadata } from "next";
import { blogArticleOfferLine } from "@/data/planOfferingCopy";
import { Open_Sans, Teko, Titillium_Web } from "next/font/google";
import "../../globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const titilliumWeb = Titillium_Web({
  variable: "--font-titillium-web",
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Jak zainstalować Planopię jako aplikację PWA? Instrukcja instalacji | Planopia",
  description: `Instrukcja instalacji Planopii jako PWA na iPhonie, iPadzie, Androidzie oraz w przeglądarce na komputerze (np. Chrome). Dodaj apkę do ewidencji czasu pracy i urlopów na ekran główny, do menu lub na pulpit. ${blogArticleOfferLine.pl}`,
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
    title: 'Jak zainstalować Planopię jako aplikację PWA? Instrukcja instalacji | Planopia',
    description: `PWA Planopii na telefon i komputer. ${blogArticleOfferLine.pl}`,
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
    title: 'Jak zainstalować Planopię jako aplikację PWA? Instrukcja instalacji | Planopia',
    description: `PWA Planopii na telefon i komputer. ${blogArticleOfferLine.pl}`,
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
  return (
    <div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>
      {children}
    </div>
  );
}
