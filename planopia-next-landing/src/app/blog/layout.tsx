import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Blog – Planopia | Porady i informacje o ewidencji czasu pracy i urlopach",
    template: "%s | Blog Planopia"
  },
  description: "Zdobądź wiedzę na temat ewidencji czasu pracy, zarządzania urlopami i nowoczesnych rozwiązań HR dzięki artykułom na blogu Planopii.",
  keywords: [
    "blog Planopia",
    "ewidencja czasu pracy",
    "zarządzanie urlopami",
    "aplikacja HR",
    "prawo pracy",
    "organizacja pracy",
    "porady HR",
    "zarządzanie zespołem",
    "czas pracy",
    "urlopy pracownicze"
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
    type: 'website',
    locale: 'pl_PL',
    url: 'https://planopia.pl/blog',
    siteName: 'Planopia',
    title: 'Blog Planopii – Porady o ewidencji czasu pracy i HR',
    description: 'Dowiedz się więcej o ewidencji czasu pracy, zarządzaniu urlopami i pracy zdalnej. Porady i nowości od twórców aplikacji Planopia.',
    images: [
      {
        url: 'https://planopia.pl/img/blog.webp',
        width: 1200,
        height: 630,
        alt: 'Blog Planopii – Porady o ewidencji czasu pracy i HR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Planopii – Porady o ewidencji czasu pracy i HR',
    description: 'Dowiedz się więcej o zarządzaniu czasem pracy, urlopami i nieobecnościami w firmie z bloga Planopii.',
    images: ['https://planopia.pl/img/blog.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog',
    languages: {
      'pl': 'https://planopia.pl/blog',
      'en': 'https://planopia.pl/en/blog',
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google verification code
  },
  category: 'technology',
};

export default function BlogLayout({
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
