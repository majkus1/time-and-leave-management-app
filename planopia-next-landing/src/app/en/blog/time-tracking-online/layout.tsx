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
  title: "Online time tracking — app, software & hour registration | Planopia",
  description:
    `Online time tracking: web-based hour registration and overtime reports — no emailed Excel files. ${blogArticleOfferLine.en}`,
  keywords: [
    "online time tracking",
    "time tracking app",
    "employee attendance software",
    "online timesheets",
    "free time tracking for teams",
    "leave management software",
    "Planopia",
    "workforce management",
    "employee scheduling",
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
    locale: 'en_US',
    url: 'https://planopia.pl/en/blog/time-tracking-online',
    siteName: 'Planopia',
    title: 'Online time tracking — software & app (no spreadsheets) | Planopia',
    description: `Hour registration and PDF/XLSX exports from a web app. ${blogArticleOfferLine.en}`,
    publishedTime: '2025-08-25T12:00:00.000Z',
    modifiedTime: '2026-03-27T12:00:00.000Z',
    images: [
      {
        url: 'https://planopia.pl/img/desktop.png',
        width: 1200,
        height: 630,
        alt: 'Online Time Tracking – modern solutions for businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online time tracking — software & app | Planopia',
    description:
      `Online attendance system with exports — Planopia. ${blogArticleOfferLine.en}`,
    images: ['https://planopia.pl/img/desktop.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/time-tracking-online',
    languages: {
      'pl': 'https://planopia.pl/blog/ewidencja-czasu-pracy-online',
      'en': 'https://planopia.pl/en/blog/time-tracking-online',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs'
  },
  category: 'technology',
};

export default function ENBlogOneLayout({
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
