import type { Metadata } from "next";
import { BLOG_FREE_APP_OG } from "@/data/blogFreeAppAssets";

export const metadata: Metadata = {
  title: {
    absolute: "Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia",
  },
  description:
    "Planopia: 30 dni pełnej aplikacji dla zespołu do 5 osób, bez karty na start; potem darmowa ewidencja do 5 kont lub pakiety — urlopy, grafik, czat i AI w cenniku.",
  keywords: [
    "darmowa aplikacja do ewidencji czasu pracy",
    "darmowa ewidencja czasu pracy online",
    "bezpłatna aplikacja do urlopów",
    "darmowy program do ewidencji godzin pracy",
    "aplikacja do ewidencji czasu pracy",
    "ewidencja czasu pracy online",
    "zarządzanie urlopami",
    "Planopia",
    "darmowa aplikacja HR",
    "program do ewidencji pracy"
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
    url: 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
    siteName: 'Planopia',
    publishedTime: '2024-10-18T12:00:00.000Z',
    modifiedTime: '2026-03-27T12:00:00.000Z',
    authors: ['Michał Lipka'],
    title: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia',
    description:
      'Darmowa ewidencja czasu pracy do 5 osób po okresie próbnym; 30 dni wcześniej z pełnymi modułami Planopii.',
    images: [
      {
        url: BLOG_FREE_APP_OG.url,
        width: BLOG_FREE_APP_OG.width,
        height: BLOG_FREE_APP_OG.height,
        alt: BLOG_FREE_APP_OG.alt.pl,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia',
    description:
      'Planopia: darmowy plan ewidencji czasu pracy po trialu lub rozszerzenie o urlopy, grafiki i AI w cenniku.',
    images: [BLOG_FREE_APP_OG.url],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
    languages: {
      'pl': 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
      'en': 'https://planopia.pl/en/blog/free-time-tracking-app',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
};

export default function BlogFourLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}
