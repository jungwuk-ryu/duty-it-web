import type { Metadata } from "next";
import HomeHero from "@/src/components/home/HomeHero";
import HomeEvents from "@/src/components/HomeEvents";
import HomeFeatures from "@/src/components/home/HomeFeatures";
import HomeDownload from "@/src/components/home/HomeDownload";
import { getHomePreviewData } from "@/src/components/home/home-preview-data";
import styles from "@/src/components/home/home.module.css";

export const metadata: Metadata = {
  title: "간호의 내일을, 발견하는 곳 | 듀잇",
  description: "간호사와 간호대학생을 위한 대외활동·행사, 학술대회, 보수교육, 봉사와 채용 공고. 듀잇에서 관심 있는 기회를 찾고 북마크로 모아보세요.",
  openGraph: {
    title: "간호의 내일을, 발견하는 곳 | 듀잇",
    description: "배우고 경험하고 나아가는 당신을 위해. 대외활동·행사를 듀잇에서 만나보세요.",
    url: "https://www.dutyit.net/",
    type: "website",
    siteName: "듀잇",
    locale: "ko_KR",
    images: [{ url: "/og/default-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "간호의 내일을, 발견하는 곳 | 듀잇",
    description: "대외활동·행사를 듀잇에서 만나보세요.",
    images: ["/og/default-1200x630.png"],
  },
};

export default async function Home() {
  const previewData = await getHomePreviewData();

  return (
    <div className={styles.home}>
      <HomeHero />
      <div className={styles.container}>
        <HomeEvents />
      </div>
      <HomeFeatures events={previewData.events} jobs={previewData.jobs} />
      <HomeDownload />
    </div>
  );
}
