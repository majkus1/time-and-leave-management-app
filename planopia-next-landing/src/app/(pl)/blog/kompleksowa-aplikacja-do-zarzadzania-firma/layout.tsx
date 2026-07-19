import type { Metadata } from "next";

const META_TITLE = "Czas pracy, urlopy i grafik w jednej aplikacji | Planopia";
const META_DESCRIPTION =
  "Połącz ewidencję czasu pracy, urlopy, grafiki, zadania i komunikację w jednej aplikacji. Zobacz, jak Planopia porządkuje pracę zespołu.";


/** Meta: ewidencja + urlopy + grafik w jednym narzędziu (bez obietnicy pełnego ERP). */
export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    "ewidencja czasu pracy i urlopy",
    "aplikacja do zarządzania zespołem",
    "program do ewidencji czasu pracy",
    "zarządzanie urlopami",
    "grafiki pracy",
    "aplikacja HR",
    "czaty zespołowe",
    "tablice zadań",
    "oprogramowanie dla małych firm",
    "Planopia",
    "system urlopów i grafików",
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
    title: META_TITLE,
    description: META_DESCRIPTION,
    publishedTime: '2025-09-15T12:00:00.000Z',
    modifiedTime: '2026-05-17T12:00:00.000Z',
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
  return children;
}
