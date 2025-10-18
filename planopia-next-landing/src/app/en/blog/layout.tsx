import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Blog – Planopia | Tips on Work Time Tracking and HR Management",
    template: "%s | Planopia Blog"
  },
  description: "Get insights into work time tracking, leave management, and modern HR solutions with articles from the official Planopia blog.",
  keywords: [
    "Planopia blog",
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
    title: 'Planopia Blog – Tips on Work Time Tracking and HR',
    description: 'Explore articles about work time tracking, leave planning, remote work, and modern HR practices from the creators of Planopia.',
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
    title: 'Planopia Blog – Tips on Work Time Tracking and HR',
    description: 'Read helpful content about managing work hours, leave requests, and employee productivity with Planopia.',
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
    google: 'your-google-verification-code', // Add your Google verification code
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
