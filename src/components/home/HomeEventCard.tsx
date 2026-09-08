import Link from "next/link";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import { BookmarkIconButton } from "@/src/components/ui/bookmark-icon-button";
import { EventStatusLabel, EventTypeLabel } from "@/src/lib/event-labels";
import type { Event } from "@/src/lib/schemas/event";
import styles from "./home.module.css";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});

export default function HomeEventCard({ event }: { event: Event }) {
  return (
    <article className={styles.eventCard}>
      <div className={styles.eventImage}>
        <Link href={`/visitEvent/${event.id}`} prefetch={false} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
          <EventThumbnail src={event.thumbnail} alt="" className={styles.eventThumbnail} />
        </Link>
        <BookmarkIconButton kind="events" itemId={event.id} title={event.title} initialSaved={event.isBookmarked} className={styles.eventBookmark} />
      </div>
      <div className={styles.eventMeta}>
        <span>{event.eventType === "CONFERENCE" ? "학술대회" : EventTypeLabel[event.eventType]}</span>
        <span>{EventStatusLabel[event.eventStatus]}</span>
      </div>
      <h3><Link href={`/visitEvent/${event.id}`} prefetch={false} target="_blank" rel="noopener noreferrer">{event.title}<span className="sr-only"> (새 탭)</span></Link></h3>
      <p className={styles.eventDetails}>
        <Link href={`/events?hostId=${event.host.id}`} prefetch={false} title={`${event.host.name}의 행사 보기`}>{event.host.name}</Link>
        <time dateTime={event.startAt.toISOString()}>{dateFormatter.format(event.startAt)}</time>
      </p>
    </article>
  );
}
