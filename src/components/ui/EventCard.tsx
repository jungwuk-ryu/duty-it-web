import Image from "next/image";
import { Event } from "@/src/lib/schemas/event";
import CategoryTag from "./EventTypeTag";
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
    const recruitmentStatus = getRecruitmentStatus(event);

    return (
        <article className="group h-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_22px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.16)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                    src={event.thumbnail ?? "/event-thumbnail-placeholder.svg"}
                    alt={`${event.title} 행사 섬네일`}
                    fill
                    loading={priority ? undefined : eager ? "eager" : undefined}
                    priority={priority}
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <Link
                    href={`/visitEvent/${event.id}`}
                    aria-label={`${event.title} 바로가기`}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-x-0 bottom-0 block p-5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-6px]"
                >
                    <h3 className="line-clamp-3 text-xl font-bold leading-snug drop-shadow-sm">
                        {event.title}
                    </h3>
                </Link>
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <CategoryTag category={event.eventType} />
                    <span className="shrink-0 text-sm font-bold text-brand">
                        {recruitmentStatus}
                    </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-gray-900">
                    <span className="mr-2 text-gray-400">주최</span>
                    {event.host.name}
                </p>

                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-200 pt-4 text-xs">
                    <div className="min-w-0">
                        <dt className="text-gray-500">일시</dt>
                        <dd className="mt-1 truncate font-semibold text-gray-900" title={formatDates(event.startAt, event.endAt)}>
                            {formatCompactDate(event.startAt)}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-gray-500">마감</dt>
                        <dd className="mt-1 truncate font-semibold text-gray-900" title={event.recruitmentEndAt == null ? "-" : formatDate(event.recruitmentEndAt)}>
                            {event.recruitmentEndAt == null ? "-" : formatCompactDate(event.recruitmentEndAt)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">조회</dt>
                        <dd className="mt-1 font-semibold text-gray-900">
                            {event.viewCount.toLocaleString("ko-KR")}
                        </dd>
                    </div>
                </dl>
            </div>
        </article>
    );
}

function getRecruitmentStatus(event: Event): string {
    if (event.eventStatus !== "RECRUITING") return EventStatusLabel[event.eventStatus];

    const dDay = getDDay(event.recruitmentEndAt);
    return dDay == null ? "모집 중" : `모집 중 · ${dDay}`;
}

function getDDay(recruitmentEndAt: Date | null): string | null {
    if (recruitmentEndAt == null) return null;

    const remainingDays = Math.floor((getKstDateValue(recruitmentEndAt) - getKstDateValue(new Date())) / 86_400_000);
    return remainingDays <= 0 ? "D-Day" : `D-${remainingDays}`;
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

function formatCompactDate(date: Date | null): string {
    if (date == null) return "-";

    const parts = KST_FORMATTER.formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    return `${year}. ${month}. ${day}.`;
}

function getKstDateValue(date: Date): number {
    const parts = KST_FORMATTER.formatToParts(date);
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);
    return Date.UTC(year, month - 1, day);
}
