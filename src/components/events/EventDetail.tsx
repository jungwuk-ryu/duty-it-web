"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, ChevronRight, Clock3, Eye, Info } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Event } from "@/src/lib/schemas/event";
import { formatEventDateTime, formatEventPeriod, getEventRecruitmentStatus, getHostEventsHref } from "@/src/lib/event-detail";
import { withUtmSource } from "@/src/lib/url";
import CategoryTag from "@/src/components/ui/EventTypeTag";
import { Button } from "@/src/components/ui/button";
import { BookmarkIconButton } from "@/src/components/ui/bookmark-icon-button";
import EventActions from "./EventActions";
import EventPoster from "./EventPoster";
import styles from "./event-detail.module.css";

export default function EventDetail({
  event,
  eventContent,
  variant = "page",
}: {
  event: Event;
  eventContent?: ReactNode;
  variant?: "page" | "panel";
}) {
  const Title = variant === "panel" ? "h2" : "h1";
  const SectionTitle = variant === "panel" ? "h3" : "h2";
  const recorded = useRef(false);
  const [views, setViews] = useState(event.viewCount);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    // Only an opened detail counts; route prefetch and metadata requests do not.
    void fetch("/api/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: event.id }) })
      .then(async (response) => { if (response.ok && (await response.json()).counted) setViews((count) => count + 1); })
      .catch(() => { /* View telemetry must not block event details. */ });
  }, [event.id]);

  return (
    <article className={`${styles.detail} ${variant === "panel" ? styles.panelDetail : styles.pageDetail}`}>
      <div className={styles.detailScroll}>
        <EventPoster src={event.thumbnail} title={event.title} />
        <div className={styles.information}>
          <div className={styles.heading}>
            <div className={styles.tags}><CategoryTag category={event.eventType} /><span className={styles.status}>{getEventRecruitmentStatus(event)}</span></div>
            {variant === "page" && <EventActions eventId={event.id} title={event.title} hostName={event.host.name} startAt={event.startAt} endAt={event.endAt} initialSaved={event.isBookmarked} />}
          </div>
          <Title id={`event-title-${event.id}`} className={styles.title}>{event.title}</Title>
          <p className={styles.hostName}>{event.host.name}</p>

          <section className={styles.schedule} aria-label="행사 및 신청 일정">
            <div className={styles.sectionHeading}><SectionTitle>일정 안내</SectionTitle><span>한국 시간 (KST)</span></div>
            <dl>
              <div className={styles.scheduleRow}>
                <CalendarDays size={20} aria-hidden />
                <div><dt>행사 일시</dt><dd>{formatEventPeriod(event.startAt, event.endAt)}</dd></div>
              </div>
              <div className={styles.scheduleRow}>
                <Clock3 size={20} aria-hidden />
                <div><dt>신청 마감</dt><dd>{event.recruitmentEndAt ? <time dateTime={event.recruitmentEndAt.toISOString()}>{formatEventDateTime(event.recruitmentEndAt)}까지</time> : "주최 페이지에서 확인해 주세요"}</dd>
                  {event.recruitmentStartAt && <dd className={styles.recruitmentStart}>신청 시작 · <time dateTime={event.recruitmentStartAt.toISOString()}>{formatEventDateTime(event.recruitmentStartAt)}</time></dd>}
                </div>
              </div>
            </dl>
          </section>

          {eventContent}

          <section className={styles.hostSection} aria-label="주최 정보">
            <div className={styles.sectionHeading}><SectionTitle>주최 안내</SectionTitle></div>
            <Link href={getHostEventsHref(event.host.id)} className={styles.hostCard} prefetch={false}>
              <HostAvatar name={event.host.name} thumbnail={event.host.thumbnail} />
              <span className={styles.hostCopy}><strong>{event.host.name}</strong><span>주최의 행사 목록 보기 <ArrowUpRight size={13} aria-hidden /></span></span>
              <ChevronRight size={18} aria-hidden className="shrink-0 text-muted-foreground" />
            </Link>
          </section>

          <div className={styles.views}><Eye size={15} aria-hidden /><span>조회 {views.toLocaleString("ko-KR")}</span></div>
          <p className={styles.notice}><Info size={17} aria-hidden /><span>자세한 내용과 신청은 주최 페이지에서 확인해 주세요.</span></p>
        </div>
      </div>
      <div className={styles.actions}>
        <BookmarkIconButton kind="events" itemId={event.id} title={event.title} initialSaved={event.isBookmarked} className="rounded-xl border border-input bg-background" />
        <Button asChild className="h-12 min-w-0 flex-1 gap-3 rounded-xl px-4 text-sm font-bold">
          <a href={withUtmSource(event.uri)} target="_blank" rel="noopener noreferrer">주최 페이지에서 자세히 보기<ArrowUpRight size={18} aria-hidden /><span className="sr-only"> (새 탭)</span></a>
        </Button>
      </div>
    </article>
  );
}

export function HostAvatar({ name, thumbnail }: { name: string; thumbnail: string | null }) {
  const [failed, setFailed] = useState(false);
  const safeThumbnail = thumbnail?.startsWith("https://api.dutyit.net/uploads/") ? thumbnail : null;
  return <span className={styles.hostAvatar}>
    {safeThumbnail && !failed
      // Host logos can be any aspect ratio; preserve the complete mark.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={safeThumbnail} alt={`${name} 로고`} onError={() => setFailed(true)} />
      : <Building2 size={25} aria-hidden />}
  </span>;
}
