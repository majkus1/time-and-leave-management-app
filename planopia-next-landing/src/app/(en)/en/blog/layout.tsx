import type { Metadata } from "next";

const BLOG_META_DESCRIPTION =
  "Practical guides to time tracking, leave planning, schedules, and team operations. Learn how to replace spreadsheets with clearer workflows.";

export const metadata: Metadata = {
  title: {
    absolute: "Planopia Blog — Time Tracking and Leave"
  },
  description: BLOG_META_DESCRIPTION,
  keywords: [
    "Planopia blog",
    "free time tracking app",
    "work time tracking",
    "leave management",
    "HR software",
    "labor law",
    "workforce organization",
    "HR tips",
    "team management",
    "work hours",
    "employee leave"
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
    type: 'website',
    locale: 'en_US',
    url: 'https://planopia.pl/en/blog',
    siteName: 'Planopia',
    title: 'Planopia Blog — Time Tracking and Leave',
    description: BLOG_META_DESCRIPTION,
    images: [
      {
        url: 'https://planopia.pl/img/blog.webp',
        width: 1200,
        height: 630,
        alt: 'Planopia Blog – Tips on Work Time Tracking and HR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planopia Blog — Time Tracking and Leave',
    description: BLOG_META_DESCRIPTION,
    images: ['https://planopia.pl/img/blog.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog',
    languages: {
      'pl': 'https://planopia.pl/blog',
      'en': 'https://planopia.pl/en/blog',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs'
  },
  category: 'technology',
};

export default function ENBlogLayout({
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
