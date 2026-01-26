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
  title: "How to Install Planopia as a PWA App? Installation Guide | Planopia",
  description: "Learn how to install Planopia as a PWA app on your mobile device. Simple installation guide for time tracking and leave management app directly on your phone's home screen.",
  keywords: [
    "PWA installation",
    "how to install PWA",
    "PWA mobile app",
    "Planopia PWA",
    "install mobile app",
    "Progressive Web App",
    "time tracking app",
    "mobile leave management",
    "mobile Planopia",
    "PWA step by step"
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
    url: 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
    siteName: 'Planopia',
    title: 'How to Install Planopia as a PWA App? Installation Guide | Planopia',
    description: 'Simple guide to installing Planopia as a PWA app on your mobile device. Learn how to add the time tracking app directly to your phone\'s home screen.',
    images: [
      {
        url: 'https://planopia.pl/img/pwa1.png',
        width: 1200,
        height: 630,
        alt: 'Installing Planopia as PWA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Install Planopia as a PWA App? Installation Guide | Planopia',
    description: 'Simple guide to installing Planopia as a PWA app on your mobile device. Learn how to add the time tracking app directly to your phone\'s home screen.',
    images: ['https://planopia.pl/img/pwa1.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
    languages: {
      'pl': 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
      'en': 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
};

export default function ENBlogPWALayout({
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
