import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Eye, Landmark } from "lucide-react";
import { Event } from "@/src/lib/schemas/event";
import { EventStatusLabel } from "@/src/lib/schemas/event-status";
import CategoryTag from "./EventTypeTag";

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
        <article className="group h-full overflow-hidden rounded-[15px] border border-line bg-surface shadow-[0_16px_28px_rgba(65,45,31,0.045)] transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_20px_38px_rgba(65,45,31,0.1)]">
            <div className="relative aspect-[1.78/1] w-full overflow-hidden bg-paper">
                <Image
                    src={event.thumbnail ?? "/event-thumbnail-placeholder.svg"}
                    alt="행사 섬네일"
                    fill
                    loading={priority ? undefined : eager ? "eager" : undefined}
                    priority={priority}
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                    <CategoryTag category={event.eventType} />
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold tracking-[-0.035em] ${getStatusClass(event.eventStatus)}`}>
                        {EventStatusLabel[event.eventStatus]}
                    </span>
                </div>
            </div>
            <div className="flex h-[calc(100%-1px)] flex-col p-5">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted">
                    <span className="inline-flex items-center gap-1.5"><Eye size={15} strokeWidth={1.9} aria-hidden="true" /> 조회 {event.viewCount.toLocaleString("ko-KR")}</span>
                </div>
                <Link
                    href={`/visitEvent/${event.id}`}
                    aria-label={`${event.title} 바로가기`}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h3 className="mt-3 text-xl font-extrabold leading-snug tracking-[-0.055em] text-ink transition group-hover:text-brand">
                        {event.title}
                    </h3>
                </Link>
                <div className="mt-4 space-y-2.5 text-sm leading-5 text-muted">
                    <p className="inline-flex items-center gap-2"><Landmark size={16} strokeWidth={1.8} aria-hidden="true" /> <span className="truncate">{event.host.name}</span></p>
                    <p className="inline-flex items-start gap-2"><CalendarDays className="mt-0.5 shrink-0" size={16} strokeWidth={1.8} aria-hidden="true" /> <span>{formatDates(event.startAt, event.endAt)}</span></p>
                    {!(event.recruitmentStartAt == null && event.recruitmentEndAt == null) ? (
                        <p className="mt-4 rounded-lg border border-brand/10 bg-brand/[0.035] px-3 py-2.5 text-[13px] leading-5 text-ink">
                            <span className="mr-2 font-bold text-brand">모집 기간</span>
                            {formatDates(event.recruitmentStartAt, event.recruitmentEndAt)}
                        </p>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function getStatusClass(status: Event["eventStatus"]) {
    if (status === "FINISHED") return "bg-gray-100 text-gray-600";
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
    if (status === "RECRUITING") return "bg-brand text-white";
    return "bg-white/90 text-brand shadow-sm";
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

    if (formattedStart === formattedEnd) return formattedStart;

    return `${formattedStart} ~ ${formattedEnd}`;
}

function formatDate(date: Date): string {
    const parts = KST_FORMATTER.formatToParts(date);
    const y = parts.find((part) => part.type === "year")?.value;
    const m = parts.find((part) => part.type === "month")?.value;
    const d = parts.find((part) => part.type === "day")?.value;
    return `${y}년 ${m}월 ${d}일`;
}
