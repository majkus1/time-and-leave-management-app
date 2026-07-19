import type { Metadata } from "next";

const META_TITLE = "Company Management App: All-in-One | Planopia";
const META_DESCRIPTION =
  "See how one app combines time tracking, leave, schedules, tasks, and team chat. A practical guide to organizing daily operations.";

export const metadata: Metadata = {
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  keywords: [
    "comprehensive company management app",
    "team management app",
    "time tracking",
    "leave management",
    "work schedules",
    "team chats",
    "task boards",
    "role configuration",
    "company management system",
    "business software",
    "Planopia",
    "project management",
    "internal communication",
    "HR app"
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
    url: 'https://planopia.pl/en/blog/comprehensive-company-management-app',
    siteName: 'Planopia',
    publishedTime: '2026-01-03T12:00:00.000Z',
    modifiedTime: '2026-01-03T12:00:00.000Z',
    authors: ['Michał Lipka'],
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: 'https://planopia.pl/img/worktimeblog.webp',
        width: 1200,
        height: 630,
        alt: 'Comprehensive Company Management App – Planopia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ['https://planopia.pl/img/worktimeblog.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/comprehensive-company-management-app',
    languages: {
      'pl': 'https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
      'en': 'https://planopia.pl/en/blog/comprehensive-company-management-app',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
};

export default function ENBlogSevenLayout({
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

