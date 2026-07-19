import type { Metadata } from "next";

const META_TITLE = "Ewidencja czasu pracy online — aplikacja | Planopia";
const META_DESCRIPTION =
  "Ewidencja czasu pracy online: godziny, nadgodziny, kalendarz i raporty PDF/Excel. Sprawdź Planopię przez 30 dni za darmo.";
import "@/app/globals.css";

/** Meta pod GSC: „ewidencja czasu pracy online”, „rejestracja czasu pracy online” — odróżnione od pillar „darmowa aplikacja”. */
export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    "ewidencja czasu pracy online",
    "rejestracja czasu pracy online",
    "program do ewidencji czasu pracy",
    "aplikacja do ewidencji godzin pracy",
    "system ewidencji czasu pracy",
    "darmowa ewidencja czasu pracy",
    "ewidencja czasu pracy bez excel",
    "Planopia",
    "zarządzanie czasem pracy",
    "nadgodziny",
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
    title: META_TITLE,
    description: META_DESCRIPTION,
    publishedTime: '2025-08-25T12:00:00.000Z',
    modifiedTime: '2026-05-31T12:00:00.000Z',
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
  return children;
}
