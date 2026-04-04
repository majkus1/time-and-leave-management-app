import type { Metadata } from "next";
import { blogArticleOfferLine } from "@/data/planOfferingCopy";
import { Open_Sans, Teko, Titillium_Web } from "next/font/google";
import "../../../globals.css";

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
    "Planopia AI Assistant: time tracking, leave, tasks, and schedules in one system | Planopia",
  description: `The Planopia AI Assistant connects time tracking, leave, tasks, and schedules — team and HR workflow automation without scattered spreadsheets. ${blogArticleOfferLine.en}`,
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
    title:
      "Planopia AI Assistant: time tracking, leave, tasks, and schedules | Planopia",
    description: `AI Assistant, time tracking, leave, tasks, and schedules in one system. ${blogArticleOfferLine.en}`,
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
    title:
      "Planopia AI Assistant: time tracking, leave, tasks, and schedules | Planopia",
    description: `HR and team workflow automation in one app. ${blogArticleOfferLine.en}`,
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
  return (
    <div
      className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}
    >
      {children}
    </div>
  );
}
