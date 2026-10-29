"use client";

import { CalendarDays, ChevronRight, Clock3, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import EventLink from "@/src/components/events/EventLink";
import CategoryTag from "@/src/components/ui/EventTypeTag";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import { BookmarkIconButton } from "@/src/components/ui/bookmark-icon-button";
import { Button } from "@/src/components/ui/button";
import { formatEventDateTime, formatEventPeriod, getEventRecruitmentStatus } from "@/src/lib/event-detail";
import { launchEventApp } from "@/src/lib/event-app-launch";
import { openEventWithHero } from "@/src/lib/event-hero";
import type { Event } from "@/src/lib/schemas/event";
import styles from "./event-collection.module.css";

type Props = {
  event: Event;
  position: number;
  summary: string | null;
  priority?: boolean;
};

export default function EventCollectionCard({ event, position, summary, priority = false }: Props) {
  const router = useRouter();
  const imageRef = useRef<HTMLDivElement>(null);
  const titleId = `collection-event-${event.id}`;

  function openDetail(click: MouseEvent<HTMLAnchorElement>) {
    if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return;
    const href = `/events/${event.id}`;
    if (!openEventWithHero(event.id, imageRef.current, () => router.push(href, { scroll: false }))) return;
    click.preventDefault();
    // EventLink skips its app launch for a handled click; keep the same tap behavior.
    launchEventApp(event.id);
  }

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div ref={imageRef} className={styles.image} data-event-hero-source={event.id}>
        <EventLink eventId={event.id} tabIndex={-1} aria-hidden="true" onClick={openDetail}>
          <EventThumbnail src={event.thumbnail} alt="" className={styles.thumbnail}
            sizes="(max-width: 640px) 100vw, 300px" priority={priority} />
        </EventLink>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.position} aria-label={`게시물 속 ${position}번째 행사`}>{String(position).padStart(2, "0")}</span>
          <CategoryTag category={event.eventType} />
          <span className={styles.status}>{getEventRecruitmentStatus(event)}</span>
        </div>
        <h2 id={titleId} className={styles.title}><EventLink eventId={event.id} onClick={openDetail}>{event.title}</EventLink></h2>
        <p className={styles.host}>{event.host.name}</p>
        <dl className={styles.schedule}>
          <div>
            <CalendarDays size={17} aria-hidden />
            <dt>행사 일시</dt>
            <dd>{formatEventPeriod(event.startAt, event.endAt)}</dd>
          </div>
          <div>
            <Clock3 size={17} aria-hidden />
            <dt>신청 마감</dt>
            <dd>{event.recruitmentEndAt
              ? <time dateTime={event.recruitmentEndAt.toISOString()}>{formatEventDateTime(event.recruitmentEndAt)}까지</time>
              : "주최 페이지에서 확인해 주세요"}</dd>
          </div>
        </dl>
        {summary && <div className={styles.summary}>
          <span className={styles.summaryLabel}><Sparkles size={13} aria-hidden />AI 요약</span>
          {/* The card shows a preview; paragraphs join so the clamp ends on a line. */}
          <p>{summary.replace(/\s*\n+\s*/g, " ")}</p>
        </div>}
        <div className={styles.actions}>
          <Button asChild className="h-11 min-w-0 flex-1 gap-1.5 rounded-xl px-4 text-sm font-bold sm:flex-none">
            <EventLink eventId={event.id} onClick={openDetail}>
              자세히 보기<ChevronRight size={17} aria-hidden /><span className="sr-only">: {event.title}</span>
            </EventLink>
          </Button>
          <BookmarkIconButton kind="events" itemId={event.id} title={event.title} initialSaved={event.isBookmarked}
            className="size-11 rounded-xl border border-input bg-background" />
        </div>
      </div>
    </article>
  );
}
