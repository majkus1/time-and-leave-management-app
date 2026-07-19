import type { Metadata } from "next";

const META_TITLE = "Online Time Tracking Software | Planopia";
const META_DESCRIPTION =
  "Track hours and overtime online, review monthly records, and export PDF/Excel reports. A practical guide to web-based time tracking.";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { absolute: META_TITLE },
  description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
    title: META_TITLE,
    description: META_DESCRIPTION,
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
  return children;
}
