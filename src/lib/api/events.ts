import "server-only";
import { EventResponse, EventsResponseSchema } from "../schemas/events-response";
import { EventType } from "../schemas/event-type";
import { EventStatusGroup } from "../schemas/event-status";

export const EVENT_SORT_FIELDS = [
    "CREATED_AT",
    "START_DATE",
    "RECRUITMENT_DEADLINE",
    "VIEW_COUNT",
] as const;

export type EventSortField = typeof EVENT_SORT_FIELDS[number];

type FetchOptions = {
    cursor?: string | null;
    field?: EventSortField;
    searchKeyword?: string | null;
    size?: number;
    statusGroup?: EventStatusGroup;
    types?: EventType[];
}

const API_BASE = process.env.API_BASE!;

export class EventsFetchError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly statusText: string,
        readonly responseBody: unknown,
    ) {
        super(message);
        this.name = "EventsFetchError";
    }
}

export async function fetchEvents(opts: FetchOptions = {}): Promise<EventResponse> {
    const {
        cursor = null,
        field = "CREATED_AT",
        searchKeyword = null,
        size = 12,
        statusGroup = "ACTIVE",
        types = [],
    } = opts;

    const params = new URLSearchParams({
        bookmarked: "false",
        field,
        size: `${size}`,
        statusGroup,
    });
    if (cursor != null) params.set("cursor", `${cursor}`);
    if (types.length > 0) params.set("types", types.join(","));
    if (searchKeyword != null && searchKeyword.trim() !== "") {
        params.set("searchKeyword", searchKeyword.trim());
    }


    const res = await fetch(`${API_BASE}/v2/events?${params.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) {
        let responseBody: unknown = null;
        try {
            responseBody = await res.json();
        } catch {
            responseBody = null;
        }

        if (res.status >= 500) {
            console.error("Failed to fetch events", {
                status: res.status,
                statusText: res.statusText,
                responseBody,
            });
        }
        throw new EventsFetchError("Failed to fetch events", res.status, res.statusText, responseBody);
    }
    
    const json = await res.json();
    const parsed = EventsResponseSchema.safeParse(json);
    if (!parsed.success) {
        console.error(parsed.error.issues);
        throw new Error("Failed to parse events response!");
    }

    return parsed.data;
}
