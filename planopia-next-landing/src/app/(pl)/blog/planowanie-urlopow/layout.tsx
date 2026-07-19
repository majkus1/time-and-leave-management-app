import type { Metadata } from "next";

const META_TITLE = "Planowanie urlopów — wnioski i kalendarz | Planopia";
const META_DESCRIPTION =
  "Planuj urlopy online: zbieraj wnioski, obsługuj akceptacje i sprawdzaj kalendarz nieobecności zespołu bez chaosu w Excelu.";
import "@/app/globals.css";

/** Meta pod GSC: „aplikacja do urlopów”, „zarządzanie urlopami”, „planowanie urlopów”. */
export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
  return children;
}
