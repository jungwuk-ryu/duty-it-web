import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "../components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import AndroidOnlySmartBanner from "../components/AndroidOnlySmartBanner";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dutyit.net"),
  title: "듀잇 | 간호의 다음 기회를 찾아봐요",
  description: "간호 대외활동·행사·학술대회·보수교육을 한곳에서 찾아봐요.",
  alternates: {
    canonical: 'https://www.dutyit.net/'
  },
  openGraph: {
    type: 'website',
    siteName: '듀잇',
    locale: 'ko_KR',
    title: '간호의 오늘에 내일의 기회를 더해요',
    description: '주요 간호 워크숍·세미나 일정을 한곳에서 보고, 마감 알림도 받아봐요.',
    images: {
      url: '/og/default-1200x630.png',
      width: 1200,
      height: 630
    }
  },
  twitter: {
    title: '간호의 다음 기회를 찾아봐요',
    description: '간호 공모전·세미나 일정을 듀잇에서 모아봐요.',
    card: 'summary_large_image',
    images: {
      url: '/og/default-1200x630.png',
      width: 1200,
      height: 630
    }
  },
  icons: {
    other: [
      { rel: "android-touch-icon", url: "/app-icon.png" }
    ]
  },
  other: {
    'apple-itunes-app': 'app-id=6751395152',
    'google-play-app' : 'app-id=com.dutyit.app',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.className} scroll-smooth`} data-scroll-behavior="smooth">
      <body className={"min-h-screen antialiased"}>
        <Header />
        <main className="min-h-screen pt-[73px]">
          {children}
        </main>
        <Footer />
        <AndroidOnlySmartBanner />
      </body>
      <GoogleAnalytics gaId={process.env.GA_ID ?? ""} />
    </html>
  );
}
