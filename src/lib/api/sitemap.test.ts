import assert from "node:assert/strict";
import { test } from "node:test";

test("XML responses reject partial API success, recover, exclude closed/pending pages, and bound stale fallback", async (t) => {
  let clock = Date.now();
  let fail = true;
  t.mock.method(Date, "now", () => clock);
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "warn", () => {});
  const event = { id: 11, title: "행사", startAt: "2026-09-01T09:00:00", endAt: null, recruitmentStartAt: null, recruitmentEndAt: null, uri: "https://example.com", thumbnail: null, eventType: "CONFERENCE", eventStatus: "RECRUITING", eventStatusGroup: "ACTIVE", host: { id: 1, name: "주최", thumbnail: null }, viewCount: 0, isBookmarked: false };
  const job = { id: 1, isActive: true, company: { id: 1 }, receiptCloseDt: "20991231", createdAt: "2020-01-01T00:00:00", updatedAt: "2020-02-01T00:00:00" };
  const page = (content: unknown[], nextCursor: string | null = null) => ({ content, pageInfo: { hasNext: nextCursor != null, nextCursor, pageSize: content.length } });
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input), "https://api.example.test");
    if (url.pathname.includes("/v2/events")) {
      return Response.json(page(url.searchParams.get("statusGroup") === "FINISHED"
        ? [{ ...event, id: 12, eventStatus: "FINISHED", eventStatusGroup: "FINISHED" }]
        : [event, { ...event, id: 13, eventStatus: "PENDING", eventStatusGroup: "PENDING" }]));
    }
    assert.ok(url.pathname.includes("/v1/job-postings"));
    if (url.searchParams.has("cursor")) {
      return fail ? Response.json({}, { status: 503 }) : Response.json(page([
        { ...job, id: 2, receiptCloseDt: "20200101" }, { ...job, id: 3, isActive: false },
      ]));
    }
    return Response.json(page([job], "next"));
  });
  const { getSitemapResponse } = await import("./sitemap");
  const failed = await getSitemapResponse("index");
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get("Cache-Control"), "no-store");
  assert.equal(failed.headers.get("Retry-After"), "60");
  assert.doesNotMatch(await failed.text(), /<urlset|<sitemapindex/);

  clock += 31_000;
  fail = false;
  const index = await getSitemapResponse("index");
  assert.equal(index.status, 200);
  assert.match(await index.text(), /sitemap-jobs-0.xml/);
  const jobs = await (await getSitemapResponse("jobs-0")).text();
  assert.match(jobs, /\/jobs\/1<\/loc>/);
  assert.doesNotMatch(jobs, /\/jobs\/[23]<\/loc>/);
  assert.match(jobs, /<lastmod>2020-01-31T15:00:00.000Z<\/lastmod>/);
  const events = await (await getSitemapResponse("events-0")).text();
  assert.match(events, /\/events\/12<\/loc>/);
  assert.doesNotMatch(events, /\/events\/13<\/loc>|lastmod/);
  assert.equal((await getSitemapResponse("jobs-999")).status, 404);
  assert.equal((await getSitemapResponse("invalid")).status, 404);

  clock += 301_000;
  fail = true;
  const stale = await getSitemapResponse("jobs-0");
  assert.equal(stale.status, 200);
  assert.equal(stale.headers.get("Cache-Control"), "no-store");
  assert.equal(await stale.text(), jobs);
  clock += 3_600_000;
  assert.equal((await getSitemapResponse("index")).status, 503);
});
