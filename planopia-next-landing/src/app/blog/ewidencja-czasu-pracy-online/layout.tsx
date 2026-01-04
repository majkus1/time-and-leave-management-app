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
  title: "Ewidencja czasu pracy online – najlepsze programy i aplikacje | Planopia",
  description: "Dowiedz się, jak prowadzić ewidencję czasu pracy online. Program Planopia automatyzuje rejestrację godzin pracy, nadgodzin i urlopów. Darmowa wersja do 6 użytkowników!",
  keywords: [
    "ewidencja czasu pracy online",
    "program do ewidencji czasu pracy",
    "aplikacja do ewidencji godzin pracy",
    "darmowa ewidencja czasu pracy",
    "rejestracja czasu pracy",
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
    title: 'Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm | Planopia',
    description: 'Jak skutecznie ewidencjonować czas pracy? Poznaj aplikację Planopia – prostą i nowoczesną alternatywę dla Excela i papierowych list. Darmowa wersja do 6 użytkowników.',
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
    title: 'Ewidencja czasu pracy online – nowoczesne rozwiązania dla firm | Planopia',
    description: 'Program Planopia do ewidencji czasu pracy i urlopów. Automatyzacja, raporty PDF/XLSX i darmowa wersja do 6 użytkowników.',
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
    google: 'your-google-verification-code', // Add your Google verification code
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
