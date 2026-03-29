import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Time Tracking App for Work Hours and Leave Management | Planopia",
  description:
    "Free time tracking app from Planopia: 30 days with the full product first, then a no-subscription time tracking tier for teams with up to 5 active accounts. Leave, schedules, team chat, Kanban, and the AI Assistant unlock with paid plans from Starter.",
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
    title: 'Free Time Tracking App for Work Hours and Leave Management | Planopia',
    description:
      'Free time tracking for up to 5 people after the trial; first month includes every Planopia module.',
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
      'Stay on free work time tracking after the trial or upgrade for leave, schedules, chat, and AI.',
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
