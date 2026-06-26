import type { Metadata } from "next";
import { BLOG_FREE_APP_OG } from "@/data/blogFreeAppAssets";

export const metadata: Metadata = {
  title: {
    absolute: "Free Time Tracking App for Work Hours and Leave Management | Planopia",
  },
  description:
    "Planopia: 30-day full trial for teams up to 5 people — no card required to start; then free time tracking for 5 accounts or paid plans — leave, schedules, chat, and AI in pricing.",
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
    title: 'Free Time Tracking App for Work Hours and Leave Management | Planopia',
    description:
      'Free time tracking for up to 5 people after the trial; first month includes every Planopia module.',
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
    title: 'Free Time Tracking App for Work Hours and Leave Management | Planopia',
    description:
      'Stay on free work time tracking after the trial or upgrade for leave, schedules, chat, and AI.',
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
