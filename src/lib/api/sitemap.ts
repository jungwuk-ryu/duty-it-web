import "server-only";

import { fetchEvents } from "./events";
import { fetchJobPostings } from "./jobs";
import { buildSitemapDocuments, collectSitemapEntries, createSitemapCache } from "../sitemap";
import { getLastModified } from "../seo-date";
import { SITE_ORIGIN } from "../seo";
import { isJobOpen } from "../jobs";
import { isHttpUrl } from "../url";

const getSnapshot = createSitemapCache(async () => {
  const now = new Date();
  // Bound the generation time, not the number of pages. Timeouts must fail the
  // entire snapshot rather than silently truncating URLs after an arbitrary cap.
  const request = { cache: "no-store" as const, signal: AbortSignal.timeout(120_000) };
  const results = await Promise.allSettled([
    ...(["ACTIVE", "FINISHED"] as const).map((statusGroup) => collectSitemapEntries(
      (cursor) => fetchEvents({ cursor, size: 100, statusGroup }, request),
      (event) => event.eventStatusGroup === "PENDING" || event.eventStatus === "PENDING" ? null : ({
        url: `${SITE_ORIGIN}/events/${event.id}`,
        lastModified: getLastModified([event.updatedAt, event.createdAt], now),
        ...(event.thumbnail && isHttpUrl(event.thumbnail) ? { images: [event.thumbnail] } : {}),
      }),
    )),
    collectSitemapEntries(
      (cursor) => fetchJobPostings({ cursor, size: 100 }, request),
      (job) => isJobOpen(job, now) ? ({
        url: `${SITE_ORIGIN}/jobs/${job.id}`,
        lastModified: getLastModified([job.updatedAt, job.createdAt, job.company.updatedAt], now),
      }) : null,
    ),
  ]);
  const pages = results.map((result) => {
    if (result.status === "rejected") throw result.reason;
    return result.value;
  });
  // An event can move from ACTIVE to FINISHED while the two groups are read.
  const events = [...new Map([...pages[0], ...pages[1]].map((entry) => [entry.url, entry])).values()]
    .sort((a, b) => Number(a.url.split("/").at(-1)) - Number(b.url.split("/").at(-1)));
  return buildSitemapDocuments({
    static: ["/", "/events", "/jobs"].map((path) => ({ url: `${SITE_ORIGIN}${path}` })),
    events,
    jobs: pages[2],
  });
});

export async function getSitemapResponse(name: string): Promise<Response> {
  if (name !== "index" && !/^(static|events|jobs)-(0|[1-9]\d*)$/.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const snapshot = await getSnapshot();
    if (snapshot.stale) console.warn("Serving last complete sitemap after upstream failure.", { createdAt: new Date(snapshot.createdAt).toISOString() });
    const xml = snapshot.value.get(name);
    if (!xml) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        // Never let an old in-process fallback become a new CDN cache entry.
        "Cache-Control": snapshot.stale ? "no-store" : "public, max-age=0, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("Sitemap generation failed; returning 503 instead of partial XML.", error);
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }
}
