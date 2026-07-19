import type { Metadata } from "next";

const META_TITLE = "Asystent AI: czas pracy, urlopy i zadania | Planopia";
const META_DESCRIPTION =
  "Zobacz, jak Asystent AI łączy dane o czasie pracy, urlopach, zadaniach i grafiku, aby szybciej podsumować sytuację zespołu.";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
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
    publishedTime: "2026-03-27T12:00:00.000Z",
    modifiedTime: "2026-03-27T12:00:00.000Z",
    authors: ["Michał Lipka"],
    title: META_TITLE,
    description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
  return children;
}
