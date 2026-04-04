import type { Metadata } from "next";
import { blogArticleOfferLine } from "@/data/planOfferingCopy";
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
  title:
    "Asystent AI w Planopii: ewidencja, urlopy, zadania i grafik w jednym systemie | Planopia",
  description: `Asystent AI łączy kontekst ewidencji czasu pracy, urlopów, zadań i grafiku — automatyzacja pracy zespołu i procesów HR bez rozproszenia danych. ${blogArticleOfferLine.pl}`,
  keywords: [
    "Asystent AI Planopia",
    "asystent AI w firmie",
    "automatyzacja pracy zespołu",
    "automatyzacja procesów HR",
    "aplikacja z AI do ewidencji czasu pracy",
    "ewidencja czasu pracy i urlopy w jednym systemie",
    "kalendarz urlopów online",
    "zarządzanie zadaniami w zespole",
    "grafik pracy",
    "planowanie zmian",
    "narzędzie HR dla małej firmy",
    "jedna aplikacja zamiast Excela",
    "Planopia",
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
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "article",
    locale: "pl_PL",
    url: "https://planopia.pl/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik",
    siteName: "Planopia",
    title:
      "Asystent AI w Planopii: ewidencja, urlopy, zadania i grafik | Planopia",
    description: `Asystent AI, ewidencja, urlopy, zadania i grafik w jednym systemie. ${blogArticleOfferLine.pl}`,
    images: [
      {
        url: "https://planopia.pl/img/aiass.webp",
        width: 1200,
        height: 630,
        alt: "Asystent AI w aplikacji Planopia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Asystent AI w Planopii: ewidencja, urlopy, zadania i grafik | Planopia",
    description: `Automatyzacja HR i pracy zespołu w jednej aplikacji. ${blogArticleOfferLine.pl}`,
    images: ["https://planopia.pl/img/aiass.webp"],
  },
  alternates: {
    canonical:
      "https://planopia.pl/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik",
    languages: {
      pl: "https://planopia.pl/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik",
      en: "https://planopia.pl/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules",
    },
  },
  verification: {
    google: "vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs",
  },
  category: "technology",
};

export default function BlogAiAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}
    >
      {children}
    </div>
  );
}
