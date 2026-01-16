import "server-only";
import { EventResponse, EventsResponseSchema } from "../schemas/events-response";

type FetchOptions = {
    cursor?: string | null
    size?: number
}

const API_BASE = process.env.API_BASE!;

export async function fetchEvents(opts: FetchOptions = {}): Promise<EventResponse> {
    const { cursor: cursor = null, size = 12 } = opts;

    const params = new URLSearchParams({
        isApproved: "true",
        isBookmarked: "false",
        size: `${size}`,
        statusGroup: "ACTIVE",
    });
    if (cursor != null) params.set("cursor", `${cursor}`);


    const res = await fetch(`${API_BASE}/v2/events?${params.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) {
        console.log(await res.text())
        throw new Error("Failed to fetch");
    }
    
    const json = await res.json();
    const parsed = EventsResponseSchema.safeParse(json);
    if (!parsed.success) {
        console.error(parsed.error.issues);
        throw new Error("Failed to parse events response!");
    }

    return parsed.data;
}