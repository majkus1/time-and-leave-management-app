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
  title: "Employee Leave Planning – Best Tools and Practices | Planopia",
  description: "Discover how to plan employee leave effectively with an online leave calendar. Planopia makes leave management simple – free plan for up to 4 users.",
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
    title: 'Employee Leave Planning – Best Tools and Practices | Planopia',
    description: 'Learn how to improve employee leave planning with Planopia – online leave calendar, approval workflow, and absence management. Free plan for small teams.',
    images: [
      {
        url: 'https://planopia.pl/img/desktop.png',
        width: 1200,
        height: 630,
        alt: 'Employee Leave Planning – Best Tools and Practices',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employee Leave Planning – Best Tools and Practices | Planopia',
    description: 'Planopia simplifies leave management with an online leave calendar, automatic notifications, and reports. Try the free plan for teams up to 4 users.',
    images: ['https://planopia.pl/img/desktop.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/leave-planning',
    languages: {
      'pl': 'https://planopia.pl/blog/planowanie-urlopow',
      'en': 'https://planopia.pl/en/blog/leave-planning',
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google verification code
  },
  category: 'technology',
};

export default function ENBlogThreeLayout({
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
