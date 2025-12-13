import type { MetadataRoute } from "next";
import { fetchEvents } from "../lib/api/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = "https://www.dutyit.net";

    return [
        {
            url: `${base}/`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1
        },
        {
            url: `${base}/events`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1
        }
    ];
}
