import type { Metadata } from "next";
import { planOfferingCopy } from "@/data/planOfferingCopy";
import { LANDING_OG_IMAGE } from "@/data/landingHeroAssets";
import { titilliumWeb } from "@/lib/siteFonts";
import "../globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleTagManagerNoScript from "@/components/GoogleTagManagerNoScript";
import LandingChatWidgetLazy from "@/components/LandingChatWidgetLazy";
import LandingNavigationEffects from "@/components/LandingNavigationEffects";
import LandingSiteFooter from "@/components/LandingSiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://planopia.pl"),
  title: {
    default: "Planopia — free time tracking online | 30-day trial",
    template: "%s | Planopia"
  },
  description: planOfferingCopy.en.metaShort,
  keywords: [
    "time tracking app",
    "free time tracking app",
    "leave management software", 
    "HR AI assistant",
    "30 day trial",
    "time tracking pricing Poland",
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
    title: 'Planopia — free time tracking online | 30-day trial',
    description: planOfferingCopy.en.metaShort,
    images: [
      {
        url: LANDING_OG_IMAGE.url,
        width: LANDING_OG_IMAGE.width,
        height: LANDING_OG_IMAGE.height,
        alt: LANDING_OG_IMAGE.alt.en,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planopia — free time tracking online | 30-day trial',
    description: planOfferingCopy.en.metaShort,
    images: [LANDING_OG_IMAGE.url],
  },
  alternates: {
    canonical: 'https://planopia.pl/en',
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

export default function EnRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${titilliumWeb.variable} ${titilliumWeb.className} antialiased`}
      >
        <GoogleTagManagerNoScript />
        <GoogleAnalytics />
        <LandingNavigationEffects />
        {children}
        <LandingSiteFooter />
        <LandingChatWidgetLazy />
      </body>
    </html>
  );
}
