import type { MetadataRoute } from "next";
import { fetchEvents } from "@/src/lib/api/events";

const EVENT_PAGE_SIZE = 100;
const MAX_EVENT_PAGES = 100;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = "https://www.dutyit.net";

    const eventEntries = await getEventEntries(base);

    return [
        {
            url: `${base}/`,
            changeFrequency: "weekly",
            priority: 1
        },
        {
            url: `${base}/events`,
            changeFrequency: "daily",
            priority: 1
        },
        {
            url: `${base}/jobs`,
            changeFrequency: "daily",
            priority: 0.9
        },
        ...eventEntries,
    ];
}

async function getEventEntries(base: string): Promise<MetadataRoute.Sitemap> {
    const entries = new Map<number, MetadataRoute.Sitemap[number]>();
    const seenCursors = new Set<string>();
    let cursor: string | null = null;

    try {
        for (let pageNumber = 0; pageNumber < MAX_EVENT_PAGES; pageNumber += 1) {
            const page = await fetchEvents({ cursor, size: EVENT_PAGE_SIZE, statusGroup: "ACTIVE" });
            for (const event of page.content) {
                entries.set(event.id, {
                    url: `${base}/events/${event.id}`,
                    changeFrequency: "daily",
                    priority: 0.8,
                });
            }

            const nextCursor = page.pageInfo.nextCursor;
            if (!page.pageInfo.hasNext || nextCursor == null || seenCursors.has(nextCursor)) break;
            seenCursors.add(nextCursor);
            cursor = nextCursor;
        }
    } catch (error) {
        console.error("Failed to add event detail pages to sitemap", error);
    }

    return [...entries.values()];
}
