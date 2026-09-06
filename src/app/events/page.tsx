import EventsResults from "@/src/components/EventsResults";
import {
    EventsFetchError,
    fetchEvents,
} from "@/src/lib/api/events";
import {
    EVENT_TYPE_OPTIONS,
    PUBLIC_STATUS_GROUP_OPTIONS,
    SORT_OPTIONS,
    getCursor,
    getEventFilters,
    getEventsHref,
    getEventsSearchParams,
    type EventFilters,
    type EventSearchParams,
} from "@/src/lib/event-query";
import { EventStatusGroupLabel, EventTypeLabel } from "@/src/lib/event-labels";
import { Metadata } from "next";
import Link from "next/link";

const EVENTS_CANONICAL = "https://www.dutyit.net/events";
const PAGE_SIZE = 12;

type Props = { searchParams: Promise<EventSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const filters = getEventFilters(await searchParams);
    const title = filters.searchKeyword
        ? `${filters.searchKeyword} 행사 검색 | 듀잇`
        : "간호 행사 목록 | 듀잇";

    return {
        title,
        alternates: {
            canonical: EVENTS_CANONICAL,
        },
        openGraph: {
            url: getEventsAbsoluteUrl(filters),
            title,
        },
    };
}

export default async function EventsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const cursor = getCursor(resolvedSearchParams);
    const filters = getEventFilters(resolvedSearchParams);
    let recoveredFromInvalidCursor = false;

    let events = await fetchEventsSafely(filters, cursor);
    if (events == null) {
        recoveredFromInvalidCursor = true;
        events = await fetchEventsSafely(filters, null);
    }
    if (events == null) {
        throw new Error("Failed to recover events list from invalid cursor.");
    }

    const initialRequest = {
        ...filters,
        cursor: recoveredFromInvalidCursor ? null : cursor,
    };

    return (
        <div className="container mx-auto px-4 mb-5 py-10">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold">행사 목록</h1>
                <p className="mt-3 text-gray-600">
                    관심 분야와 일정에 맞는 행사만 골라 확인해보세요.
                </p>
            </header>

            {recoveredFromInvalidCursor && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                    페이지 정보가 만료되어 첫 페이지를 보여드려요.{" "}
                    <Link className="font-semibold underline" href={getEventsHref(filters, null)}>
                        정리된 주소로 보기
                    </Link>
                </div>
            )}
            <EventsResults
                initialData={events}
                initialRequest={initialRequest}
                sortOptions={SORT_OPTIONS}
                statusOptions={PUBLIC_STATUS_GROUP_OPTIONS.map((value) => ({ value, label: EventStatusGroupLabel[value] }))}
                typeOptions={EVENT_TYPE_OPTIONS.map((value) => ({ value, label: EventTypeLabel[value] }))}
            />
        </div>
    );
}

async function fetchEventsSafely(filters: EventFilters, cursor: string | null): Promise<Awaited<ReturnType<typeof fetchEvents>> | null> {
    try {
        return await fetchEvents({
            cursor,
            field: filters.field,
            hostId: filters.hostId,
            searchKeyword: filters.searchKeyword,
            size: PAGE_SIZE,
            statusGroup: filters.statusGroup,
            types: filters.types,
        });
    } catch (error) {
        if (cursor != null && error instanceof EventsFetchError && error.status === 400) {
            return null;
        }
        throw error;
    }
}

function getEventsAbsoluteUrl(filters: EventFilters): string {
    const url = new URL(EVENTS_CANONICAL);
    const params = getEventsSearchParams(filters, null);
    params.forEach((value, key) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}
