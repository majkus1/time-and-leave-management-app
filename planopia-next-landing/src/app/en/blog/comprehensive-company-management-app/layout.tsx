import type { Metadata } from "next";
import { blogArticleOfferLine } from "@/data/planOfferingCopy";

export const metadata: Metadata = {
  title: "Comprehensive Company Management App – Everything in One Place | Planopia",
  description: `Planopia is a comprehensive company management app — time tracking, leave, schedules, chats, tasks, and roles. ${blogArticleOfferLine.en}`,
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
    title: 'Comprehensive Company Management App – Everything in One Place | Planopia',
    description: `Time tracking, leave, schedules, chats, and tasks in one tool. ${blogArticleOfferLine.en}`,
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
    title: 'Comprehensive Company Management App – Everything in One Place | Planopia',
    description: `All-in-one operations for your team. ${blogArticleOfferLine.en}`,
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

