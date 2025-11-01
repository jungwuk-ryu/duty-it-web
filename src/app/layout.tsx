import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "../components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dutyit.net"),
  title: "듀잇",
  description: "국내 모든 간호 행사가 한곳에!",
  alternates: {
    canonical: 'https://www.dutyit.net/'
  },
  openGraph: {
    type: 'website',
    siteName: '듀잇',
    locale: 'ko_KR',
    title: '간호 행사, 1분 만에 찾기',
    description: '주요 간호 워크숍·세미나 일정을 한곳에서 보고, 마감 알림으로 놓치지 마세요.',
    images: {
      url: '/og/default-1200x630.png',
      width: 1200,
      height: 630
    }
  },
  twitter: {
    title: '🔥 간호 행사 놓치지 마',
    description: '간호 공모전·세미나 일정 듀잇이 모아뒀어😋',
    card: 'summary_large_image',
    images: {
      url: '/og/default-1200x630.png',
      width: 1200,
      height: 630
    }
  },
  other: {
    'apple-itunes-app': 'app-id=6751395152'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.className} scroll-smooth`} data-scroll-behavior="smooth">
      <body
        className={"antialiased min-h-screen flex flex-col"}
      >
        <Header />
        <main className="flex-1 pt-20 bg-[#F8F9FA] ">
          {children}
        </main>
        <Footer />
      </body>
      <GoogleAnalytics gaId={process.env.GA_ID ?? ""} />
    </html>
  );
}
