import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comprehensive Company Management App – Everything in One Place | Planopia",
  description: "Planopia is a comprehensive company management app. Time tracking, leave management, work schedules, team chats, task boards, and flexible role configuration. Everything in one tool for your team.",
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
    description: 'Planopia is a comprehensive company management app. Time tracking, leave management, work schedules, team chats, task boards, and flexible role configuration. Everything in one tool.',
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
    description: 'Planopia combines time tracking, leave management, work schedules, team chats, task boards, and flexible role configuration. Everything in one tool for your team.',
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
    google: 'your-google-verification-code',
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

