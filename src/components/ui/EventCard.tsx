"use client";

import Link from "next/link";
import EventLink from "@/src/components/events/EventLink";
import type { MouseEvent } from "react";
import { EventTypeLabel } from "@/src/lib/event-labels";
import { getEventDday } from "@/src/lib/event-dday";
import type { Event } from "@/src/lib/schemas/event";
import EventThumbnail from "./EventThumbnail";
import { BookmarkIconButton } from "./bookmark-icon-button";
import styles from "./event-item.module.css";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});

type Props = {
    event: Event;
    referenceDate: string;
    eager?: boolean;
    onHostClick?: (hostId: number) => void;
    priority?: boolean;
};

export default function EventCard({ event, referenceDate, eager = false, onHostClick, priority = false }: Props) {
    const dday = getEventDday(event.startAt, new Date(referenceDate));

    return (
        <article className={styles.item}>
            <div className={styles.image}>
                <EventLink eventId={event.id} tabIndex={-1} aria-hidden="true">
                    <EventThumbnail src={event.thumbnail} alt="" className={styles.thumbnail}
                        sizes="(max-width: 799px) 50vw, 280px" eager={eager} priority={priority} />
                </EventLink>
                <BookmarkIconButton kind="events" itemId={event.id} title={event.title} initialSaved={event.isBookmarked} className={styles.bookmark} />
            </div>
            <div className={styles.meta}>
                <span>{event.eventType === "CONFERENCE" ? "학술대회" : EventTypeLabel[event.eventType]}</span>
                {dday && <time className={styles.dday} dateTime={event.startAt.toISOString()} title={`행사 시작일 ${dateFormatter.format(event.startAt)}`}>
                    <span className="sr-only">행사 시작일 기준 </span>{dday}
                </time>}
            </div>
            <h3><EventLink eventId={event.id}>{event.title}</EventLink></h3>
            <p className={styles.host}>
                <Link href={`/events?hostId=${event.host.id}`} prefetch={false}
                    title={`${event.host.name}의 행사 보기`}
                    onClick={(click) => handleHostClick(click, event.host.id, onHostClick)}>
                    {event.host.name}
                </Link>
            </p>
        </article>
    );
}

function handleHostClick(event: MouseEvent<HTMLAnchorElement>, hostId: number, onHostClick?: (hostId: number) => void) {
    if (!onHostClick || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onHostClick(hostId);
}
