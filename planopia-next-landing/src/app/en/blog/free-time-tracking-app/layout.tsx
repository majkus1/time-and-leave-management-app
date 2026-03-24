import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Time Tracking App for Work Hours and Leave Management | Planopia",
  description:
    "Planopia: 30-day trial with full features for up to 5 users. Time tracking and leave management — then pick a paid plan that fits your team.",
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
    description:
      'Planopia: 30-day trial, full features, up to 5 users. Time tracking and leave management; transparent pricing after the trial.',
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
    description:
      'Try Planopia free for 30 days — up to 5 users, full product. Work hours and leave management in one app.',
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
