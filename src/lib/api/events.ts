import "server-only";
import { EventResponse, EventsResponseSchema } from "../schemas/events-response";

type FetchOptions = {
    page?: number
    size?: number
}

const API_BASE = process.env.API_BASE!;

export async function fetchEvents(opts: FetchOptions = {}): Promise<EventResponse> {
    const { page = 0, size = 12 } = opts;

    const params = new URLSearchParams({
        isApproved: "true",
        includeFinished: "true",
        isBookmarked: "false",
        page: `${page}`,
        size: `${size}`,
        sortDirection: "DESC",
        field: "ID"
    });

    const res = await fetch(`${API_BASE}/events?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch");

    const json = await res.json();
    const parsed = EventsResponseSchema.safeParse(json);
    if (!parsed.success) {
        console.error(parsed.error.issues);
        throw new Error("Failed to parse events response!");
    }

    return parsed.data;
}