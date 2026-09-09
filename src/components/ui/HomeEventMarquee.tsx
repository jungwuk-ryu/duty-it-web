import Link from "next/link";
import { Marquee } from "@/src/components/ui/3d-testimonails";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import { Event } from "@/src/lib/schemas/event";
import { EventTypeLabel } from "@/src/lib/schemas/event-type";

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
});

const MAX_COLUMNS = 3;

type Props = {
    events: readonly Event[];
};

export default function HomeEventMarquee({ events }: Props) {
    const columns = splitIntoColumns(events);

    if (columns.length === 0) return null;

    return (
        <div className="relative h-[25rem] overflow-hidden rounded-3xl border border-border/80 bg-background [perspective:720px] sm:h-[27rem]">
            <div
                className="absolute left-1/2 top-0 flex w-max gap-3 sm:gap-4"
                style={{
                    transform:
                        "translateX(calc(-50% - 2.75rem)) translateY(-1.25rem) translateZ(-5rem) rotateX(12deg) rotateY(-9deg) rotateZ(4deg)",
                }}
            >
                {columns.map((column, index) => (
                    <Marquee
                        key={`event-column-${index}`}
                        vertical
                        reverse={index % 2 === 1}
                        pauseOnHover
                        className="h-[32rem] w-52 [--duration:40s] sm:w-56"
                        ariaLabel={`다가오는 행사 ${index + 1}열`}
                    >
                        {column.map((event) => (
                            <EventTickerCard key={event.id} event={event} />
                        ))}
                    </Marquee>
                ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/85 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/85 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />
        </div>
    );
}

function EventTickerCard({ event }: { event: Event }) {
    return (
        <Link
            href={`/visitEvent/${event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            aria-label={`${event.title} 행사 상세 페이지를 새 탭에서 열기`}
            className="group/event block w-52 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_8px_18px_rgba(15,23,42,0.10)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(15,23,42,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:w-56"
        >
            <div className="relative h-20 overflow-hidden bg-muted sm:h-[5.5rem]">
                <EventThumbnail
                    src={event.thumbnail}
                    alt=""
                    quality={70}
                    sizes="(min-width: 640px) 224px, 208px"
                    className="object-cover transition duration-300 group-hover/event:scale-105"
                />
            </div>
            <div className="flex min-h-[6.5rem] flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-bold leading-5 text-foreground">{event.title}</p>
                <div className="mt-auto flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-brand">{EventTypeLabel[event.eventType]}</span>
                    <time className="shrink-0 text-muted-foreground" dateTime={event.startAt.toISOString()}>
                        {KST_DATE_FORMATTER.format(event.startAt)}
                    </time>
                </div>
                <p className="truncate text-xs text-muted-foreground">{event.host.name}</p>
            </div>
        </Link>
    );
}

function splitIntoColumns(events: readonly Event[]): Event[][] {
    const columnCount = Math.min(MAX_COLUMNS, events.length);
    if (columnCount === 0) return [];

    const itemsPerColumn = Math.ceil(events.length / columnCount);
    return Array.from({ length: columnCount }, (_, index) =>
        events.slice(index * itemsPerColumn, (index + 1) * itemsPerColumn),
    ).filter((column) => column.length > 0);
}
