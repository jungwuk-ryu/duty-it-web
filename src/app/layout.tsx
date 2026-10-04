import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "../components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import AndroidOnlySmartBanner from "../components/AndroidOnlySmartBanner";
import SessionProvider from "../components/SessionProvider";
import ThemeProvider from "../components/ThemeProvider";
import { AnimatedThemeToggle } from "../components/ui/animated-theme-toggle";
import { serializeJsonLd, SITE_DESCRIPTION, SITE_ORIGIN, SITE_TITLE } from "../lib/seo";
import { getOrganizationStructuredData } from "../lib/site-info";
import { initialAuthState } from "../lib/auth/server";
import { IOS_APP_ID } from "../lib/event-app-links";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "듀잇",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: '듀잇',
    locale: 'ko_KR',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: {
      url: '/og/default-1200x630.png',
      width: 1200,
      height: 630
    }
  },
  twitter: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    card: 'summary_large_image',
    images: {
      url: '/og/default-1200x630.png',
      width: 1200,
      height: 630
    }
  },
  icons: {
    icon: "/app-icon-transparent.png",
    apple: "/app-icon-transparent.png",
    other: [
      { rel: "android-touch-icon", url: "/app-icon-transparent.png" }
    ]
  },
  itunes: { appId: IOS_APP_ID },
  other: {
    'google-play-app' : 'app-id=com.dutyit.app',
  }
};

export default async function RootLayout({
  children,
  eventModal,
}: Readonly<{
  children: React.ReactNode;
  eventModal: React.ReactNode;
}>) {
  const initialAuth = await initialAuthState();
  return (
    <html lang="ko" className={`${notoSansKR.className} scroll-smooth motion-reduce:scroll-auto`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={"antialiased min-h-screen flex flex-col bg-background text-foreground"}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(getOrganizationStructuredData()) }} />
        <ThemeProvider>
          <SessionProvider initialAuth={initialAuth}>
            <Header />
            <AnimatedThemeToggle className="app-theme-toggle fixed bottom-6 right-6 z-50 bg-background/90 shadow-lg shadow-slate-950/10 backdrop-blur-sm" />
            <main className="flex-1 bg-canvas">
              {children}
            </main>
            {eventModal}
            <Footer />
            <AndroidOnlySmartBanner />
          </SessionProvider>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId={process.env.GA_ID ?? ""} />
    </html>
  );
}
