import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "듀잇",
  description: "국내 모든 간호 행사가 한 곳에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
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
