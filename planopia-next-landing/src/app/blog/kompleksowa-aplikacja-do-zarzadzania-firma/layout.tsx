import type { Metadata } from "next";
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
  title: "Kompleksowa aplikacja do zarządzania firmą – wszystko w jednym miejscu | Planopia",
  description: "Planopia to kompleksowa aplikacja do zarządzania firmą. Ewidencja czasu pracy, urlopy, grafiki pracy, czaty, tablice zadań i elastyczna konfiguracja ról. Wszystko w jednym narzędziu dla Twojego zespołu.",
  keywords: [
    "kompleksowa aplikacja do zarządzania firmą",
    "aplikacja do zarządzania zespołem",
    "ewidencja czasu pracy",
    "zarządzanie urlopami",
    "grafiki pracy",
    "czaty zespołowe",
    "tablice zadań",
    "konfiguracja ról",
    "system zarządzania firmą",
    "oprogramowanie dla firm",
    "Planopia",
    "zarządzanie projektami",
    "komunikacja wewnętrzna",
    "aplikacja HR"
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
    url: 'https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
    siteName: 'Planopia',
    title: 'Kompleksowa aplikacja do zarządzania firmą – wszystko w jednym miejscu | Planopia',
    description: 'Planopia to kompleksowa aplikacja do zarządzania firmą. Ewidencja czasu pracy, urlopy, grafiki pracy, czaty, tablice zadań i elastyczna konfiguracja ról. Wszystko w jednym narzędziu.',
    images: [
      {
        url: 'https://planopia.pl/img/worktimeblog.webp',
        width: 1200,
        height: 630,
        alt: 'Kompleksowa aplikacja do zarządzania firmą – Planopia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kompleksowa aplikacja do zarządzania firmą – wszystko w jednym miejscu | Planopia',
    description: 'Planopia łączy ewidencję czasu pracy, urlopy, grafiki pracy, czaty, tablice zadań i elastyczną konfigurację ról. Wszystko w jednym narzędziu dla Twojego zespołu.',
    images: ['https://planopia.pl/img/worktimeblog.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
    languages: {
      'pl': 'https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
      'en': 'https://planopia.pl/en/blog/comprehensive-company-management-app',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
};

export default function BlogSevenLayout({
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

