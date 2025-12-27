import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Time Tracking App for Work Hours and Leave Management | Planopia",
  description: "Discover Planopia - a free time tracking app for work hours and leave management for teams up to 4 people. Full functionality without any costs. Start today!",
  keywords: [
    "free time tracking app",
    "free work hours tracking",
    "free leave management software",
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
    title: 'Free Time Tracking App for Work Hours and Leave Management | Planopia',
    description: 'Planopia is a free time tracking app for work hours and leave management. Full functionality for teams up to 4 people. No hidden fees, no time limits.',
    images: [
      {
        url: 'https://planopia.pl/img/desktop.png',
        width: 1200,
        height: 630,
        alt: 'Free time tracking app - Planopia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Time Tracking App for Work Hours and Leave Management | Planopia',
    description: 'Discover Planopia - a free time tracking app for work hours. Full functionality for teams up to 4 people. Start today!',
    images: ['https://planopia.pl/img/desktop.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/free-time-tracking-app',
    languages: {
      'pl': 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
      'en': 'https://planopia.pl/en/blog/free-time-tracking-app',
    },
  },
  verification: {
    google: 'your-google-verification-code',
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
