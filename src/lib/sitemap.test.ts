import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSitemapDocuments, collectSitemapEntries, createSitemapCache, SITEMAP_MAX_URLS } from "./sitemap";

test("pagination traverses more than 100 pages, deduplicates, and excludes ineligible items", async () => {
  const entries = await collectSitemapEntries(async (cursor) => {
    const id = Number(cursor ?? 1);
    return { content: [{ id }, ...(id > 1 ? [{ id: id - 1 }] : [])], pageInfo: { hasNext: id < 102, nextCursor: String(id + 1) } };
  }, ({ id }) => id === 2 ? null : { url: `https://www.dutyit.net/jobs/${id}` });
  assert.equal(entries.length, 101);
  assert.equal(entries.at(-1)?.url, "https://www.dutyit.net/jobs/102");
});

test("midstream failures, missing/repeated cursors, and non-advancing pages fail the entire collection", async () => {
  let calls = 0;
  await assert.rejects(collectSitemapEntries(async () => {
    if (calls++) throw new Error("upstream down");
    return { content: [{ id: 1 }], pageInfo: { hasNext: true, nextCursor: "next" } };
  }, ({ id }) => ({ url: String(id) })), /upstream down/);
  for (const nextCursor of [null, "", "repeated"]) {
    await assert.rejects(collectSitemapEntries(async () => ({ content: [{ id: 1 }], pageInfo: { hasNext: true, nextCursor } }), ({ id }) => ({ url: String(id) })), /did not advance/);
  }
});

test("sitemaps split at 50,000 URLs, escape XML, include images and omit invented lastmod", () => {
  const entries = Array.from({ length: SITEMAP_MAX_URLS + 1 }, (_, id) => ({ url: `https://www.dutyit.net/jobs/${id + 1}` }));
  const docs = buildSitemapDocuments({ jobs: entries, events: [{ url: "https://www.dutyit.net/events/1", images: ["https://api.dutyit.net/image?a=1&b=2"] }] });
  assert.equal((docs.get("jobs-0")!.match(/<url>/g) ?? []).length, 50_000);
  assert.equal((docs.get("jobs-1")!.match(/<url>/g) ?? []).length, 1);
  assert.match(docs.get("index")!, /https:\/\/www.dutyit.net\/sitemap-jobs-1.xml/);
  assert.match(docs.get("events-0")!, /<image:loc>https:\/\/api.dutyit.net\/image\?a=1&amp;b=2/);
  assert.doesNotMatch(docs.get("jobs-0")!, /lastmod|priority|changefreq/);
});

test("size limits use uncompressed UTF-8 bytes rather than JavaScript string length", () => {
  const docs = buildSitemapDocuments({ events: Array.from({ length: 8 }, (_, id) => ({ url: `https://www.dutyit.net/간호/${id}` })) }, { urls: 50_000, bytes: 360 });
  assert.ok(docs.has("events-1"));
  for (const [name, xml] of docs) if (name !== "index") assert.ok(Buffer.byteLength(xml) <= 360);
  assert.throws(() => buildSitemapDocuments({ events: [{ url: `https://www.dutyit.net/${"x".repeat(400)}` }] }, { urls: 50_000, bytes: 360 }), /exceeds/);
});

test("legitimately empty groups are omitted instead of publishing empty XML files", () => {
  const docs = buildSitemapDocuments({ static: [{ url: "https://www.dutyit.net/" }], events: [], jobs: [] });
  assert.deepEqual([...docs.keys()], ["static-0", "index"]);
  assert.throws(() => buildSitemapDocuments({ events: [], jobs: [] }), /empty sitemap index/);
});

test("only complete successes replace cache; stale fallback is bounded and concurrent calls coalesce", async () => {
  let clock = 0;
  let calls = 0;
  let fail = false;
  const cache = createSitemapCache(async () => { calls++; if (fail) throw new Error("API unavailable"); return [calls]; }, { now: () => clock, ttl: 10, maxAge: 50, retryAfter: 5 });
  await Promise.all([cache(), cache(), cache()]);
  assert.equal(calls, 1);
  fail = true;
  clock = 11;
  assert.deepEqual(await cache(), { value: [1], createdAt: 0, stale: true });
  assert.equal(calls, 2);
  await cache();
  assert.equal(calls, 2);
  clock = 51;
  await assert.rejects(cache(), /API unavailable/);
  fail = false;
  clock = 57;
  assert.deepEqual(await cache(), { value: [4], createdAt: 57, stale: false });
});

test("a cold cache never turns a failed generation into an empty successful sitemap", async () => {
  const cache = createSitemapCache(async () => { throw new Error("no snapshot"); });
  await assert.rejects(cache(), /no snapshot/);
  await assert.rejects(cache(), /no snapshot/);
});
