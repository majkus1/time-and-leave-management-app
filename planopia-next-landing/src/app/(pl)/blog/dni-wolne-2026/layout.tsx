import type { Metadata } from "next";
import { planOfferingCopy } from "@/data/planOfferingCopy";


export const metadata: Metadata = {
  title: {
    absolute: "Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy w Polsce | Planopia",
  },
  description: "Kompletny kalendarz dni wolnych 2026 w Polsce. Sprawdź wszystkie święta ustawowe, długie weekendy i dowiedz się, jak efektywnie zaplanować urlopy w 2026 roku. Planowanie urlopów z aplikacją Planopia.",
  keywords: [
    "dni wolne 2026",
    "święta 2026",
    "kalendarz dni wolnych 2026",
    "dni ustawowo wolne 2026",
    "święta państwowe 2026",
    "długie weekendy 2026",
    "planowanie urlopów 2026",
    "kalendarz świąt 2026",
    "dni wolne od pracy 2026",
    "święta w Polsce 2026",
    "roczny plan urlopów 2026 excel darmowy",
    "program do urlopów darmowy",
    "Planopia",
    "planowanie urlopów",
    "kalendarz urlopowy",
    "zarządzanie urlopami"
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
    url: 'https://planopia.pl/blog/dni-wolne-2026',
    siteName: 'Planopia',
    publishedTime: '2026-01-05T12:00:00.000Z',
    modifiedTime: '2026-01-05T12:00:00.000Z',
    authors: ['Michał Lipka'],
    title: 'Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy w Polsce | Planopia',
    description: `Kalendarz świąt i dni wolnych 2026. ${planOfferingCopy.pl.metaShort}`,
    images: [
      {
        url: 'https://planopia.pl/img/plans-urlopnew.webp',
        width: 1200,
        height: 630,
        alt: 'Dni wolne 2026 – kalendarz świąt w Polsce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy | Planopia',
    description: `Dni wolne 2026 i urlopy w firmie. ${planOfferingCopy.pl.metaShort}`,
    images: ['https://planopia.pl/img/plans-urlopnew.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/dni-wolne-2026',
    languages: {
      'x-default': 'https://planopia.pl/blog/dni-wolne-2026',
      pl: 'https://planopia.pl/blog/dni-wolne-2026',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'information',
};

export default function BlogHolidays2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

