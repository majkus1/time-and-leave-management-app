import type { Metadata } from "next";
import { planOfferingCopy } from "@/data/planOfferingCopy";

export const metadata: Metadata = {
  title: {
    default: "Planopia — free time tracking app | 30-day full trial",
    template: "%s | Planopia"
  },
  description: planOfferingCopy.en.metaLong,
  keywords: [
    "time tracking app",
    "free time tracking app",
    "leave management software", 
    "HR AI assistant",
    "30 day trial",
    "time tracking pricing Poland",
    "employee scheduling",
    "HR software",
    "work hours tracking",
    "vacation calendar",
    "Planopia",
    "time tracking software",
    "leave management system",
    "employee time management",
    "workforce management",
    "attendance tracking"
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
    url: 'https://planopia.pl/en',
    siteName: 'Planopia',
    title: 'Planopia — free time tracking | 30-day full trial',
    description: planOfferingCopy.en.metaShort,
    images: [
      {
        url: 'https://planopia.pl/img/headerimage.png',
        width: 1200,
        height: 630,
        alt: 'Planopia - time tracking, leave management and AI assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planopia — free time tracking after trial',
    description: planOfferingCopy.en.metaShort,
    images: ['https://planopia.pl/img/headerimage.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en',
    languages: {
      'pl': 'https://planopia.pl',
      'en': 'https://planopia.pl/en',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
};

export default function EnglishLayout({
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
