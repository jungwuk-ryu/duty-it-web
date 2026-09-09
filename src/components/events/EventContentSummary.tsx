import { CircleAlert, Sparkles } from "lucide-react";
import { fetchEventContent } from "@/src/lib/api/event-content";
import styles from "./event-detail.module.css";

export default async function EventContentSummary({
  eventId,
  headingLevel = "h2",
}: {
  eventId: string;
  headingLevel?: "h2" | "h3";
}) {
  const content = await fetchEventContent(eventId);
  if (!content) return null;

  const Heading = headingLevel;

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
      <p className={styles.contentSummaryNotice}>
        <CircleAlert size={15} aria-hidden />
        <span>AI가 행사 자료를 바탕으로 정리한 내용으로, 일부 정보가 정확하지 않을 수 있어요. 신청 전 주최 페이지에서 확인해 주세요.</span>
      </p>
    </section>
  );
}
