import type { MetadataRoute } from "next";
import { fetchEvents } from "../lib/api/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = "https://www.dutyit.net";

    const events = await fetchEvents();
    const totalPages = events.pageInfo.totalPages;

    const eventsPages = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => ({
        url: `${base}/events?page=${i + 1}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        {
            url: `${base}/`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1
        },
        ...eventsPages,
    ];
}
