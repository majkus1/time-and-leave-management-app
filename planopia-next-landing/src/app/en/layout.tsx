import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Planopia – Free Time Tracking & Leave Management App",
    template: "%s | Planopia"
  },
  description: "Planopia is a comprehensive company management app. Time tracking, leave management, work schedules, chats, task boards — everything in one place. Free for teams up to 4 users. Paid plans available for unlimited users, advanced features, and integrations.",
  keywords: [
    "free time tracking app",
    "free leave management software", 
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
    title: 'Planopia – Free Time Tracking & Leave Management App',
    description: 'Try Planopia for free – comprehensive company management app. Time tracking, leave management, work schedules, chats, task boards. Free for up to 4 users. Upgrade to paid plans for unlimited users, flexibility, and integrations.',
    images: [
      {
        url: 'https://planopia.pl/img/headerimage.png',
        width: 1200,
        height: 630,
        alt: 'Planopia – Free Time Tracking & Leave Management App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planopia – Free Time Tracking & Leave Management App',
    description: 'Comprehensive company management app. Time tracking, leave management, work schedules, chats, task boards. Free for teams up to 4 users. Paid plans available for unlimited users and more features.',
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
    google: 'your-google-verification-code', // Add your Google verification code
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
