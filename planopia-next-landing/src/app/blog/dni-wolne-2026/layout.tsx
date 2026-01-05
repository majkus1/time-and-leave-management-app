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
  title: "Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy w Polsce | Planopia",
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
    title: 'Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy w Polsce | Planopia',
    description: 'Sprawdź kompletny kalendarz dni wolnych 2026 w Polsce. Wszystkie święta ustawowe, długie weekendy i porady dotyczące efektywnego planowania urlopów w 2026 roku.',
    images: [
      {
        url: 'https://planopia.pl/img/plans-urlop.webp',
        width: 1200,
        height: 630,
        alt: 'Dni wolne 2026 – kalendarz świąt w Polsce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dni wolne 2026 – kalendarz świąt i dni ustawowo wolnych od pracy | Planopia',
    description: 'Kompletny kalendarz dni wolnych 2026 w Polsce. Wszystkie święta ustawowe i porady dotyczące planowania urlopów.',
    images: ['https://planopia.pl/img/plans-urlop.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/blog/dni-wolne-2026',
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
  return (
    <div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>
      {children}
    </div>
  );
}

