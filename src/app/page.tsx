import type { Metadata } from "next";
import { Suspense } from "react";
import HomeHero from "@/src/components/home/HomeHero";
import HomeEvents from "@/src/components/HomeEvents";
import HomeFeatures from "@/src/components/home/HomeFeatures";
import HomeDownload from "@/src/components/home/HomeDownload";
import HomeValue from "@/src/components/home/HomeValue";
import HomeJobs from "@/src/components/home/HomeJobs";
import styles from "@/src/components/home/home.module.css";
import { serializeJsonLd, SITE_DESCRIPTION, SITE_ORIGIN, SITE_TITLE } from "@/src/lib/seo";
import { getWebsiteStructuredData } from "@/src/lib/site-info";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_ORIGIN}/` },
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://www.dutyit.net/",
    type: "website",
    siteName: "듀잇",
    locale: "ko_KR",
    images: [{ url: "/og/default-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og/default-1200x630.png"],
  },
};

export default function Home() {
  return (
    <div className={styles.home}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(getWebsiteStructuredData()) }} />
      <HomeHero />
      <HomeValue />
      <div className={styles.container}>
        <HomeEvents />
      </div>
      <HomeJobs />
      <Suspense fallback={<div className={styles.featuresLoading} role="status" aria-label="앱 기능을 불러오는 중이에요." />}>
        <HomeFeatures />
      </Suspense>
      <HomeDownload />
    </div>
  );
}
