import EventsResults from "@/src/components/EventsResults";
import EventCategoryExplore from "@/src/components/EventCategoryExplore";
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
    isEventListView,
    type EventFilters,
    type EventSearchParams,
} from "@/src/lib/event-query";
import { EventStatusGroupLabel, EventTypeLabel } from "@/src/lib/event-labels";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEventsListMetadata } from "@/src/lib/list-seo";

const PAGE_SIZE = 12;
// Re-enable ALL when the public events API supports statusGroup=ALL.
const FILTER_STATUS_GROUP_OPTIONS = PUBLIC_STATUS_GROUP_OPTIONS.filter((value) => value !== "ALL");

type Props = { searchParams: Promise<EventSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    return getEventsListMetadata(await searchParams);
}

export default async function EventsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const cursor = getCursor(resolvedSearchParams);
    const filters = getEventFilters(resolvedSearchParams);
    const events = await fetchEventsSafely(filters, cursor);
    if (events == null) redirect(getEventsHref(filters, null));

    const initialRequest = {
        ...filters,
        cursor,
    };

    return (
        <div className="container mx-auto px-4 mb-5 py-10">
            <EventsResults
                key={`${isEventListView(resolvedSearchParams)}:${getEventsHref(initialRequest, initialRequest.cursor)}`}
                categoryExplore={<EventCategoryExplore />}
                initialData={events}
                initialIsListView={isEventListView(resolvedSearchParams)}
                initialRequest={initialRequest}
                sortOptions={SORT_OPTIONS}
                statusOptions={FILTER_STATUS_GROUP_OPTIONS.map((value) => ({
                    value,
                    label: EventStatusGroupLabel[value],
                }))}
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
