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
  title: "Planowanie urlopów pracowników – jak uniknąć chaosu w firmie? | Planopia",
  description: "Sprawdź, jak skutecznie planować urlopy pracowników w firmie. Planopia: 30 dni za darmo, do 5 użytkowników, pełne funkcje. Kalendarz urlopowy online, powiadomienia i raporty.",
  keywords: [
    "planowanie urlopów",
    "kalendarz urlopów online",
    "aplikacja do urlopów",
    "ewidencja urlopów",
    "zarządzanie nieobecnościami",
    "program HR",
    "Planopia",
    "urlopy pracownicze",
    "kalendarz urlopowy",
    "zarządzanie zespołem"
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
    title: 'Planowanie urlopów pracowników – jak uniknąć chaosu w firmie? | Planopia',
    description: 'Planowanie urlopów z Planopią: 30 dni za darmo, do 5 użytkowników. Kalendarz urlopowy online, akceptacje i raporty dla HR.',
    images: [
      {
        url: 'https://planopia.pl/img/planvacationblog.webp',
        width: 1200,
        height: 630,
        alt: 'Planowanie urlopów pracowników – jak uniknąć chaosu w firmie?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planowanie urlopów pracowników – jak uniknąć chaosu w firmie? | Planopia',
    description: 'Planopia: 30 dni za darmo, do 5 użytkowników. Kalendarz urlopowy online, akceptacje wniosków i raporty dla HR.',
    images: ['https://planopia.pl/img/planvacationblog.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/planowanie-urlopow',
    languages: {
      'pl': 'https://planopia.pl/blog/planowanie-urlopow',
      'en': 'https://planopia.pl/en/blog/leave-planning',
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google verification code
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
