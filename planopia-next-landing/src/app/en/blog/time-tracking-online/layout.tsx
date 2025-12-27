import type { Metadata } from "next";
import { Open_Sans, Teko, Titillium_Web } from "next/font/google";
import "../../../globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const titilliumWeb = Titillium_Web({
  variable: "--font-titillium-web",
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Online Time Tracking – best apps and software for companies | Planopia",
  description: "Discover how to track working hours online. Planopia automates employee attendance, overtime, and leave management. Free plan for up to 4 users!",
  keywords: [
    "online time tracking",
    "time tracking app",
    "employee attendance software",
    "online timesheets",
    "free time tracking for teams",
    "leave management software",
    "Planopia",
    "workforce management",
    "employee scheduling",
    "HR software"
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
    url: 'https://planopia.pl/en/blog/time-tracking-online',
    siteName: 'Planopia',
    title: 'Online Time Tracking – modern solutions for businesses | Planopia',
    description: 'Planopia is a modern online time tracking app for businesses. Automate working hours, overtime, and leave management. Free for teams up to 4 users.',
    images: [
      {
        url: 'https://planopia.pl/img/desktop.png',
        width: 1200,
        height: 630,
        alt: 'Online Time Tracking – modern solutions for businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online Time Tracking – modern solutions for businesses | Planopia',
    description: 'Discover Planopia – a simple and powerful app for online time tracking, attendance, and leave management. Free plan available for up to 4 users.',
    images: ['https://planopia.pl/img/desktop.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/time-tracking-online',
    languages: {
      'pl': 'https://planopia.pl/blog/ewidencja-czasu-pracy-online',
      'en': 'https://planopia.pl/en/blog/time-tracking-online',
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google verification code
  },
  category: 'technology',
};

export default function ENBlogOneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${openSans.variable} ${teko.variable} ${titilliumWeb.variable}`}>
      {children}
    </div>
  );
}
