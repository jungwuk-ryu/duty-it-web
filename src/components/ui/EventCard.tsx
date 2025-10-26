import { Event } from '@/src/lib/schemas/event';
import CategoryTag from './EventTypeTag';

type Props = {
    event: Event
};

export default function EventCard({ event }: Props) {
    return (
        <a href={event.uri.toString()} aria-label='행사 바로가기'>
        <div className="rounded-lg hover:scale-103 transition-transform drop-shadow-lg bg-white p-5 cursor-pointer">
            <div className="relative aspect-[2/1] w-full content-center overflow-hidden mb-3">
                <img
                    src={event.thumbnail ?? "/event-thumbnail-placeholder.svg"}
                    alt="행사 섬네일"
                    className='rounded-lg object-cover absolute inset-0 w-full h-full'
                />
            </div>
            <div className="flex-1">
                <CategoryTag category={event.eventType} />
                <h4 className='text-xl font-bold mt-3 mb-3 truncate'>{event.title}</h4>
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
        </div>
        </a>
    );
}

function formatDates(start: Date | null, end: Date | null): string {
    if (start == null && end == null) return "";

    if (end == null) {
        return formatDate(start!);
    }
    if (start == null) {
        return formatDate(end!);
    }

    return `${formatDate(start)} ~ ${formatDate(end)}`;
}

function formatDate(date: Date): string {
    return `${date.getFullYear()}년 ${date.getMonth()}월 ${date.getDay()}일`;
}