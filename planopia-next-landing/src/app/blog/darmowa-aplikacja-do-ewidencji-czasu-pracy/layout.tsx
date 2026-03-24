import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia",
  description:
    "Planopia: 30 dni za darmo — pełne funkcje, do 5 użytkowników. Ewidencja czasu pracy i zarządzanie urlopami w jednej aplikacji. Potem proste plany płatne.",
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
    title: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia',
    description:
      'Planopia: 30 dni za darmo, pełne funkcje, do 5 użytkowników. Ewidencja czasu pracy i urlopy — potem wybierasz plan dopasowany do zespołu.',
    images: [
      {
        url: 'https://planopia.pl/img/desktop.png',
        width: 1200,
        height: 630,
        alt: 'Darmowa aplikacja do ewidencji czasu pracy - Planopia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów | Planopia',
    description:
      'Planopia: miesiąc za darmo (30 dni), do 5 użytkowników, pełna funkcjonalność. Ewidencja czasu pracy i urlopy w jednym miejscu.',
    images: ['https://planopia.pl/img/desktop.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
    languages: {
      'pl': 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
      'en': 'https://planopia.pl/en/blog/free-time-tracking-app',
    },
  },
  verification: {
    google: 'your-google-verification-code',
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
