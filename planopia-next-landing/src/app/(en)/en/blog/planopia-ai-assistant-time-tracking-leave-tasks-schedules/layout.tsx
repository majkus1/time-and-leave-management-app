import type { Metadata } from "next";

const META_TITLE = "AI for Time Tracking, Leave and Tasks | Planopia";
const META_DESCRIPTION =
  "See how AI connects time tracking, leave, tasks, and schedules to summarize team activity and support faster daily decisions.";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    "Planopia AI Assistant",
    "AI assistant for business",
    "team workflow automation",
    "HR process automation",
    "AI time tracking app",
    "time tracking and leave in one system",
    "online leave calendar",
    "team task management",
    "work schedules",
    "shift planning",
    "HR software for small business",
    "one app instead of Excel",
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
    locale: "en_US",
    url: "https://planopia.pl/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules",
    siteName: "Planopia",
    publishedTime: "2026-03-27T12:00:00.000Z",
    modifiedTime: "2026-03-27T12:00:00.000Z",
    authors: ["Michał Lipka"],
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: "https://planopia.pl/img/aiass-en.webp",
        width: 1200,
        height: 630,
        alt: "Planopia AI Assistant in the app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ["https://planopia.pl/img/aiass-en.webp"],
  },
  alternates: {
    canonical:
      "https://planopia.pl/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules",
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

export default function ENBlogAiAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
