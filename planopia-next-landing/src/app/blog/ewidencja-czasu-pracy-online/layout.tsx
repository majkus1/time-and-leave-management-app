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
  title:
    "Ewidencja czasu pracy online — program, aplikacja, rejestracja godzin | Planopia",
  description:
    `Ewidencja czasu pracy online: system rejestracji godzin i nadgodzin z przeglądarki — bez plików Excel na mailu. ${blogArticleOfferLine.pl}`,
  keywords: [
    "ewidencja czasu pracy online",
    "program do ewidencji czasu pracy",
    "aplikacja do ewidencji godzin pracy",
    "rejestracja czasu pracy online",
    "system ewidencji czasu pracy",
    "darmowa ewidencja czasu pracy",
    "ewidencja czasu pracy excel",
    "Planopia",
    "zarządzanie czasem pracy",
    "nadgodziny",
    "urlopy pracownicze",
    "HR software"
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
    url: 'https://planopia.pl/blog/ewidencja-czasu-pracy-online',
    siteName: 'Planopia',
    title:
      'Ewidencja czasu pracy online — program i aplikacja (bez Excela) | Planopia',
    description: `Rejestracja godzin i raporty PDF/XLSX z aplikacji webowej. ${blogArticleOfferLine.pl}`,
    publishedTime: '2025-08-25T12:00:00.000Z',
    modifiedTime: '2026-03-27T12:00:00.000Z',
    images: [
      {
        url: 'https://planopia.pl/img/desktop.png',
        width: 1200,
        height: 630,
        alt: 'Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Ewidencja czasu pracy online — program i aplikacja | Planopia',
    description:
      `System ewidencji online z raportami — zamiast arkuszy. ${blogArticleOfferLine.pl}`,
    images: ['https://planopia.pl/img/desktop.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/ewidencja-czasu-pracy-online',
    languages: {
      'pl': 'https://planopia.pl/blog/ewidencja-czasu-pracy-online',
      'en': 'https://planopia.pl/en/blog/time-tracking-online',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs'
  },
  category: 'technology',
};

export default function BlogOneLayout({
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
