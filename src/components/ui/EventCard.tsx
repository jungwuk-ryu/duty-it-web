import Image from "next/image";
import { Event } from '@/src/lib/schemas/event';
import CategoryTag from './EventTypeTag';
import Link from "next/link";
import { EventStatusLabel } from "@/src/lib/schemas/event-status";

const KST_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
});

type Props = {
    event: Event;
    eager?: boolean;
    priority?: boolean;
};

export default function EventCard({ event, eager = false, priority = false }: Props) {
    return (
        <article className="h-full rounded-lg hover:scale-103 transition-transform drop-shadow-lg bg-white p-5">
            <div className="relative aspect-[2/1] w-full content-center overflow-hidden mb-3">
                <Image
                    src={event.thumbnail ?? "/event-thumbnail-placeholder.svg"}
                    alt="행사 섬네일"
                    fill
                    loading={priority ? undefined : eager ? "eager" : undefined}
                    priority={priority}
                    className="rounded-lg object-cover"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
                />
            </div>
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <CategoryTag category={event.eventType} />
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                        {EventStatusLabel[event.eventStatus]}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                        조회 {event.viewCount.toLocaleString("ko-KR")}
                    </span>
                </div>
                <Link
                    href={`/visitEvent/${event.id}`}
                    aria-label={`${event.title} 바로가기`}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h3 className='text-xl font-bold mt-3 mb-3'>
                        {event.title}
                    </h3>
                </Link>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-semibold w-16 inline-block">주최</span> {event.host.name}</p>
                    <p><span className="font-semibold w-16 inline-block">일시</span> {formatDates(event.startAt, event.endAt)}</p>
                    {!(event.recruitmentStartAt == null && event.recruitmentEndAt == null) &&
                        <p>
                            <span className="font-semibold w-16 inline-block">
                                모집
                            </span>
                            {formatDates(event.recruitmentStartAt, event.recruitmentEndAt)}
                        </p>}
                </div>
            </div>
        </article>
    );
}

function formatDates(start: Date | null, end: Date | null): string {
    if (start == null && end == null) return "";

    if (end == null) {
        return start == null ? "" : formatDate(start);
    }
    if (start == null) {
        return `~ ${formatDate(end)}`;
    }

    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);

    if (formattedStart == formattedEnd) return formattedStart;

    return `${formattedStart} ~ ${formattedEnd}`;
}

function formatDate(date: Date): string {
    const parts = KST_FORMATTER.formatToParts(date);
    const y = parts.find(p => p.type === "year")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    const d = parts.find(p => p.type === "day")?.value;
    return `${y}년 ${m}월 ${d}일`;
}
