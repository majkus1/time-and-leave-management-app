import type { Metadata } from "next";
import "@/app/globals.css";

/** Meta pod GSC: „ewidencja czasu pracy online”, „rejestracja czasu pracy online” — odróżnione od pillar „darmowa aplikacja”. */
export const metadata: Metadata = {
  title: {
    absolute:
      "Ewidencja czasu pracy online — darmowa aplikacja web | Planopia",
  },
  description:
    "Program do ewidencji czasu pracy w przeglądarce: godziny, nadgodziny, raporty PDF i Excel. 30 dni pełnej wersji za darmo; potem ewidencja do 5 osób bez opłat.",
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
    title: 'Ewidencja czasu pracy online — darmowa aplikacja web | Planopia',
    description:
      'Rejestracja godzin online, nadgodziny i eksport PDF/Excel — bez wysyłania arkuszy mailem. Wypróbuj Planopię: 30 dni pełnej aplikacji, potem darmowa ewidencja do 5 osób.',
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
    title: 'Ewidencja czasu pracy online — darmowa aplikacja web | Planopia',
    description:
      'Aplikacja do ewidencji godzin w przeglądarce — raporty PDF/Excel, trial 30 dni, potem darmowy plan do 5 pracowników.',
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
