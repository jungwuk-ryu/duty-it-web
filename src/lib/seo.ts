import type { Metadata } from "next";

export const SITE_ORIGIN = "https://www.dutyit.net";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/og/default-1200x630.png`;
export const SITE_DESCRIPTION = "간호사와 간호대학생을 위한 대외활동·행사, 학술대회, 보수교육, 봉사와 채용 공고. 듀잇에서 관심 있는 기회를 찾고 북마크로 모아보세요.";

export function getPageMetadata({
  title, description, url, image = DEFAULT_SOCIAL_IMAGE, index = true,
}: { title: string; description: string; url: string; image?: string; index?: boolean }) {
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index, follow: true },
    openGraph: { type: "website", siteName: "듀잇", locale: "ko_KR", title, description, url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  } satisfies Metadata;
}

export function getBreadcrumbStructuredData(section: "events" | "jobs", title: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "듀잇", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: section === "events" ? "간호 행사" : "간호 채용", item: `${SITE_ORIGIN}/${section}` },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
