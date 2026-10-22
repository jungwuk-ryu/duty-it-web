import { CircleAlert, Sparkles } from "lucide-react";
import { fetchEventContent } from "@/src/lib/api/event-content";
import { getKoreanDate } from "@/src/lib/seo-date";
import { isHttpUrl } from "@/src/lib/url";
import styles from "./event-detail.module.css";

export default async function EventContentSummary({
  eventId,
  sourceUrl,
  headingLevel = "h2",
}: {
  eventId: string;
  sourceUrl: string;
  headingLevel?: "h2" | "h3";
}) {
  const content = await fetchEventContent(eventId);
  if (!content) return null;

  const Heading = headingLevel;
  const generatedDate = getKoreanDate(content.generatedAt);

  return (
    <section className={styles.contentSummary} aria-labelledby={`event-content-${eventId}`}>
      <div className={styles.contentSummaryHeading}>
        <span className={styles.contentSummaryIcon}><Sparkles size={16} aria-hidden /></span>
        <div>
          <span className={styles.contentSummaryLabel}>AI로 정리했어요</span>
          <Heading id={`event-content-${eventId}`}>행사 내용</Heading>
        </div>
      </div>
      <div className={styles.contentSummaryBody}>{content.body}</div>
      <div className={styles.contentSummarySource}>
        {generatedDate && <p>AI 요약 생성일: <time dateTime={content.generatedAt}>{generatedDate} (한국 시간)</time></p>}
        {isHttpUrl(sourceUrl) && <a href={sourceUrl} target="_blank" rel="noopener noreferrer">주최 측 원문 확인<span className="sr-only"> (새 탭)</span></a>}
      </div>
      <p className={styles.contentSummaryNotice}>
        <CircleAlert size={15} aria-hidden />
        <span>AI가 행사 자료를 바탕으로 정리한 내용으로, 오류나 누락이 있을 수 있어요. 요약 생성일은 주최 측 정보의 최종 수정일이 아닙니다. 신청 전 주최 페이지에서 확인해 주세요.</span>
      </p>
    </section>
  );
}
