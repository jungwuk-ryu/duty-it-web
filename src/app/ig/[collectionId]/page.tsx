import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarX2, CircleAlert, Info } from "lucide-react";
import EventCollectionCard from "@/src/components/events/EventCollectionCard";
import styles from "@/src/components/events/event-collection.module.css";
import { COLLECTION_ID_PATTERN, fetchInstagramCollection } from "@/src/lib/api/instagram-collection";
import { DEFAULT_SOCIAL_IMAGE } from "@/src/lib/seo";

const TITLE = "행사 모아보기 | 듀잇";
const DESCRIPTION = "게시물에 소개된 행사의 일정과 신청 기간을 확인하세요.";

// Links are shared through Instagram DMs only; keep them out of search results.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  openGraph: { type: "website", siteName: "듀잇", locale: "ko_KR", title: TITLE, description: DESCRIPTION, images: [DEFAULT_SOCIAL_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [DEFAULT_SOCIAL_IMAGE] },
};

export default async function InstagramCollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  if (!COLLECTION_ID_PATTERN.test(collectionId)) notFound();
  const collection = await fetchInstagramCollection(collectionId);
  if (collection.status === "not_found") notFound();

  const entries = collection.status === "ready" ? collection.entries : [];
  const hasSummary = entries.some(({ content }) => content);
  return <div className={styles.page}>
    <header className={styles.intro}>
      {entries.length > 0 && <span className={styles.count}>행사 {entries.length}개</span>}
      <h1>행사 모아보기</h1>
      <p>일정과 신청 기간을 확인하고, 행사를 눌러 자세히 살펴보세요.</p>
    </header>

    {collection.status === "unavailable" ? <section className={styles.state} role="status">
      <CircleAlert size={30} strokeWidth={1.6} aria-hidden />
      <h2>행사 정보를 잠시 불러오지 못했어요</h2>
      <p>잠시 후 페이지를 다시 열어 주세요.</p>
    </section> : entries.length === 0 ? <section className={styles.state}>
      <CalendarX2 size={30} strokeWidth={1.6} aria-hidden />
      <h2>지금 볼 수 있는 행사가 없어요</h2>
      <p>소개된 행사의 공개가 종료되었어요. 다른 행사를 둘러보세요.</p>
    </section> : <ol className={styles.list} aria-label="소개된 행사">
      {entries.map(({ position, event, content }, index) => <li key={event.id}>
        <EventCollectionCard event={event} position={position} summary={content?.body ?? null} priority={index === 0} />
      </li>)}
    </ol>}

    {collection.status === "ready" && collection.hiddenCount > 0 && entries.length > 0 &&
      <p className={styles.hiddenNote}>공개가 종료된 행사 {collection.hiddenCount}개는 표시하지 않았어요.</p>}

    <p className={styles.notice}>
      <Info size={15} aria-hidden />
      <span>
        {hasSummary && "AI 요약은 행사 자료를 바탕으로 정리한 내용으로, 오류나 누락이 있을 수 있어요. "}
        신청 조건과 변경된 일정은 주최 페이지에서 꼭 확인해 주세요.
      </span>
    </p>
    <Link href="/events" className={styles.more} prefetch={false}>다른 행사 둘러보기<ArrowRight size={16} aria-hidden /></Link>
  </div>;
}
