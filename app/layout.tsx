import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import { Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "듀잇",
  description: "국내 모든 간호 행사가 한 곳에!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKR.className}>
      <body
        className={"antialiased min-h-screen flex flex-col"}
      >
        <Header />
        <main className="flex-1 pt-20 bg-[#F8F9FA] ">
        {children}
        </main>
        
      </body>
    </html>
  );
}
