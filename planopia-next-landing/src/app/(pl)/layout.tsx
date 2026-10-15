import type { Metadata } from "next";
import { LANDING_OG_IMAGE } from "@/data/landingHeroAssets";
import { titilliumWeb } from "@/lib/siteFonts";
import "../globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import ReferralCapture from "@/components/ReferralCapture";
import LandingChatWidgetLazy from "@/components/LandingChatWidgetLazy";
import { LandingChatProvider } from "@/components/landingChat/LandingChatProvider";
import { landingChatModulesForUi } from "@/lib/landingChat/modulesForUi";
import LandingNavigationEffects from "@/components/LandingNavigationEffects";
import LandingSiteFooter from "@/components/LandingSiteFooter";
import { ANNOUNCE_DISMISS_SCRIPT } from "@/lib/announcementBar";
import LandingAnnouncementBar from "@/components/landingHome/LandingAnnouncementBar";
import { PARTNER_PAGE_PATH, TERMS_LABEL } from "@/data/partnerProgramCopy";

const HOME_META_DESCRIPTION =
  "Planopia łączy ewidencję czasu pracy, urlopy, grafiki i zadania. Zacznij od 30 dni za darmo, bez karty; potem wybierz darmowy plan lub pakiet.";

export const metadata: Metadata = {
  metadataBase: new URL("https://planopia.pl"),
  title: {
    default: "Planopia — darmowa ewidencja czasu pracy online | 30 dni",
    template: "%s | Planopia"
  },
  description: HOME_META_DESCRIPTION,
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
    title: 'Planopia — darmowa ewidencja czasu pracy online | 30 dni',
    description: HOME_META_DESCRIPTION,
    images: [
      {
        url: LANDING_OG_IMAGE.url.pl,
        width: LANDING_OG_IMAGE.width,
        height: LANDING_OG_IMAGE.height,
        alt: LANDING_OG_IMAGE.alt.pl,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planopia — darmowa ewidencja czasu pracy online | 30 dni',
    description: HOME_META_DESCRIPTION,
    images: [LANDING_OG_IMAGE.url.pl],
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

export default function PlRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: skrypt w <head> może dodać klasę lab-off (zamknięty pasek ogłoszenia) przed hydratacją
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANNOUNCE_DISMISS_SCRIPT }} />
      </head>
      <body
        className={`${titilliumWeb.variable} ${titilliumWeb.className} antialiased`}
      >
        {/* Ogłoszenie nad menu na wszystkich stronach PL — nagłówki przesuwają się o --lab-h */}
        <LandingAnnouncementBar href={PARTNER_PAGE_PATH} rate={TERMS_LABEL.initial} />
        <GoogleAnalytics />
        <LandingNavigationEffects />
        {/* Jeden stan czatu dla sekcji na stronie głównej i widgetu na pozostałych stronach */}
        <LandingChatProvider locale="pl" modules={landingChatModulesForUi("pl")}>
          {children}
          <LandingSiteFooter />
          <LandingChatWidgetLazy />
        </LandingChatProvider>
        <CookieConsent />
        <ReferralCapture />
      </body>
    </html>
  );
}
