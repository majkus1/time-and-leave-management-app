import type { Metadata } from "next";

const META_TITLE = "Free Time Tracking App for Teams | Planopia";
const META_DESCRIPTION =
  "Track work hours and leave in one app. Start with a 30-day full trial, then use free time tracking for up to 5 active accounts.";
import { BLOG_FREE_APP_OG } from "@/data/blogFreeAppAssets";

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    "free time tracking app",
    "free work hours tracking",
    "free time tracking after trial",
    "free employee time tracking",
    "time tracking app",
    "work hours tracking",
    "leave management",
    "Planopia",
    "free HR app",
    "employee time management"
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
    url: 'https://planopia.pl/en/blog/free-time-tracking-app',
    siteName: 'Planopia',
    publishedTime: '2024-10-18T12:00:00.000Z',
    modifiedTime: '2026-03-27T12:00:00.000Z',
    authors: ['Michał Lipka'],
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: BLOG_FREE_APP_OG.url,
        width: BLOG_FREE_APP_OG.width,
        height: BLOG_FREE_APP_OG.height,
        alt: BLOG_FREE_APP_OG.alt.en,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [BLOG_FREE_APP_OG.url],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/free-time-tracking-app',
    languages: {
      'pl': 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
      'en': 'https://planopia.pl/en/blog/free-time-tracking-app',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
};

export default function ENBlogFourLayout({
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
