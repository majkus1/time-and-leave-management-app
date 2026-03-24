import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Planopia - time tracking, leave & AI assistant | 30-day trial",
    template: "%s | Planopia"
  },
  description: "Planopia: time tracking, leave, schedules, chat, Kanban, and an AI Assistant grounded in team data. 30-day free trial - full features, up to 5 users, AI limits during trial. Then simple monthly plans from 99 PLN; extra AI message packs available in the app after you have an active paid plan.",
  keywords: [
    "time tracking app",
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
    title: 'Planopia - time tracking, leave & AI assistant | 30-day trial',
    description: '30-day trial: full features, up to 5 users, AI Assistant within trial limits. Then monthly plans from 99 PLN with user and AI quotas.',
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
    title: 'Planopia - time tracking, leave & AI | 30-day trial',
    description: '30-day trial with full product access. AI Assistant, time and leave tracking - then plans from 99 PLN/mo.',
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
