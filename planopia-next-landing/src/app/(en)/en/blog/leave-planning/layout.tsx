import type { Metadata } from "next";
import { blogArticleOfferLine } from "@/data/planOfferingCopy";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "Employee Leave Planning – Best Tools and Practices | Planopia",
  },
  description:
    `Employee leave planning with an online calendar and approvals. ${blogArticleOfferLine.en}`,
  keywords: [
    "leave planning",
    "employee leave management",
    "online leave calendar",
    "PTO tracker",
    "absence management",
    "vacation planning software",
    "HR app",
    "Planopia",
    "leave management system",
    "approval workflow"
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
    url: 'https://planopia.pl/en/blog/leave-planning',
    siteName: 'Planopia',
    publishedTime: '2025-08-25T12:00:00.000Z',
    modifiedTime: '2025-08-25T12:00:00.000Z',
    authors: ['Michał Lipka'],
    title: 'Employee Leave Planning – Best Tools and Practices | Planopia',
    description: `Online leave calendar, approvals, and absence management. ${blogArticleOfferLine.en}`,
    images: [
      {
        url: 'https://planopia.pl/img/plans-urlopnewen.webp',
        width: 1200,
        height: 630,
        alt: 'Employee Leave Planning – Best Tools and Practices',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employee Leave Planning – Best Tools and Practices | Planopia',
    description:
      `PTO calendar and HR reports. ${blogArticleOfferLine.en}`,
    images: ['https://planopia.pl/img/plans-urlopnewen.webp'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/leave-planning',
    languages: {
      'pl': 'https://planopia.pl/blog/planowanie-urlopow',
      'en': 'https://planopia.pl/en/blog/leave-planning',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs'
  },
  category: 'technology',
};

export default function ENBlogThreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
