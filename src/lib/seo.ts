import type { Metadata } from "next";

export const SITE_ORIGIN = "https://www.dutyit.net";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/og/default-1200x630.png`;
export const SITE_TITLE = "간호사·간호대학생 대외활동과 채용 | 듀잇";
export const SITE_DESCRIPTION = "간호대학생 대외활동부터 간호사 행사·채용까지. 봉사, 서포터즈, 공모전, 학술대회와 교육 정보를 찾아보고 모집 일정과 주최기관을 확인하세요.";

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
      { "@type": "ListItem", position: 2, name: section === "events" ? "대외활동·행사" : "간호 채용", item: `${SITE_ORIGIN}/${section}` },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
