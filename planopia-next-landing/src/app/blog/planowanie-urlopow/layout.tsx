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

/** Meta pod GSC: „aplikacja do urlopów”, „zarządzanie urlopami”, „planowanie urlopów”. */
export const metadata: Metadata = {
  title: {
    absolute: "Aplikacja do urlopów — planowanie i wnioski online | Planopia",
  },
  description:
    "Kalendarz urlopów, wnioski i akceptacje w jednym systemie — koniec z chaosem w Excelu. Program do planowania urlopów; 30 dni trial, potem plan do 5 osób.",
  keywords: [
    "aplikacja do urlopów",
    "program do urlopów",
    "planowanie urlopów",
    "zarządzanie urlopami",
    "kalendarz urlopów online",
    "program do wniosków urlopowych",
    "ewidencja urlopów",
    "zarządzanie nieobecnościami",
    "Planopia",
    "urlopy pracownicze",
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
    url: 'https://planopia.pl/blog/planowanie-urlopow',
    siteName: 'Planopia',
    title: 'Aplikacja do urlopów — planowanie i wnioski online | Planopia',
    description:
      'Planowanie urlopów pracowników: kalendarz, wnioski i akceptacje online. Wypróbuj Planopię — 30 dni pełnej aplikacji, potem darmowa ewidencja do 5 kont.',
    publishedTime: '2025-06-10T12:00:00.000Z',
    modifiedTime: '2026-05-17T12:00:00.000Z',
    images: [
      {
        url: 'https://planopia.pl/img/plans-urlopnew.webp',
        width: 1200,
        height: 630,
        alt: 'Planowanie urlopów pracowników – jak uniknąć chaosu w firmie?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aplikacja do urlopów — planowanie i wnioski online | Planopia',
    description:
      'Kalendarz urlopowy i wnioski w jednej aplikacji — bez papieru i Excela. Trial 30 dni, potem darmowy plan ewidencji do 5 osób.',
    images: ['https://planopia.pl/img/plans-urlopnew.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/planowanie-urlopow',
    languages: {
      'pl': 'https://planopia.pl/blog/planowanie-urlopow',
      'en': 'https://planopia.pl/en/blog/leave-planning',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs'
  },
  category: 'technology',
};

export default function BlogThreeLayout({
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
