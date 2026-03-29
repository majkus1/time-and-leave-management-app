import type { Metadata } from "next";
import { planOfferingCopy } from "@/data/planOfferingCopy";
import { Geist, Geist_Mono } from "next/font/google";
import { Open_Sans, Teko, Titillium_Web } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";
import GoogleTagManagerNoScript from "../components/GoogleTagManagerNoScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  title: {
    default: "Planopia — darmowa ewidencja czasu pracy online | 30 dni pełnej aplikacji",
    template: "%s | Planopia"
  },
  description: planOfferingCopy.pl.metaLong,
  keywords: [
    "ewidencja czasu pracy",
    "darmowa aplikacja ewidencja czasu pracy",
    "aplikacja do urlopów", 
    "asystent AI HR",
    "30 dni za darmo",
    "darmowa ewidencja czasu pracy po próbie",
    "darmowy program do ewidencji czasu pracy",
    "cennik ewidencja czasu pracy",
    "kalendarz urlopów online",
    "program HR",
    "zarządzanie czasem pracy",
    "oprogramowanie dla firm",
    "Planopia"
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
    locale: 'pl_PL',
    url: 'https://planopia.pl',
    siteName: 'Planopia',
    title: 'Planopia — darmowa ewidencja czasu pracy | 30 dni pełnej aplikacji',
    description: planOfferingCopy.pl.metaShort,
    images: [
      {
        url: 'https://planopia.pl/img/headerimage.png',
        width: 1200,
        height: 630,
        alt: 'Planopia - ewidencja czasu pracy, urlopy i Asystent AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planopia — darmowa ewidencja czasu pracy | trial 30 dni',
    description: planOfferingCopy.pl.metaShort,
    images: ['https://planopia.pl/img/headerimage.png'],
  },
  alternates: {
    canonical: 'https://planopia.pl',
    languages: {
      'pl': 'https://planopia.pl',
      'en': 'https://planopia.pl/en',
    },
  },
  verification: {
    google: 'vqK0qvKKbzo3mrL-VPWqdHEoe3pqVyvOs1kID0L1kWs',
  },
  category: 'technology',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} ${teko.variable} ${titilliumWeb.variable} antialiased`}
      >
        <GoogleTagManagerNoScript />
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
