import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchInstagramCollection } from "./instagram-collection";

const originalApiBase = process.env.API_BASE;
const originalSurferBase = process.env.SURFER_API_BASE;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalApiBase === undefined) delete process.env.API_BASE;
  else process.env.API_BASE = originalApiBase;
  if (originalSurferBase === undefined) delete process.env.SURFER_API_BASE;
  else process.env.SURFER_API_BASE = originalSurferBase;
  globalThis.fetch = originalFetch;
});

function event(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `행사 ${id}`,
    startAt: "2099-11-01T09:00:00",
    endAt: null,
    recruitmentStartAt: null,
    recruitmentEndAt: "2099-10-30T23:59:00",
    uri: "https://host.example.test/notice",
    thumbnail: null,
    eventType: "SEMINAR",
    eventStatus: "RECRUITING",
    eventStatusGroup: "ACTIVE",
    host: { id: 3, name: "간호협회", thumbnail: null },
    viewCount: 0,
    isBookmarked: false,
    ...overrides,
  };
}

function serve(collectionId: string, routes: Record<string, () => Response>) {
  const requested: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requested.push(url);
    assert.equal(new Headers(init?.headers).has("Authorization"), false);
    if (url === `https://surfer.example.test/api/v1/public/instagram-collections/${collectionId}`) {
      return routes.collection();
    }
    const content = url.match(/\/api\/v1\/public\/duit-events\/(\d+)\/content$/);
    if (content) return routes[`content:${content[1]}`]?.() ?? Response.json({
      schemaVersion: "duit-event-content-api.v1", eventId: content[1], availability: "unavailable", content: null,
    });
    const detail = url.match(/^https:\/\/api\.example\.test\/api\/v2\/events\/(\d+)$/);
    if (detail) return routes[`event:${detail[1]}`]?.() ?? new Response(null, { status: 404 });
    throw new Error(`unexpected request ${url}`);
  };
  return requested;
}

test("keeps post order and positions while hiding events that are no longer public", async () => {
  process.env.API_BASE = "https://api.example.test/api";
  process.env.SURFER_API_BASE = "https://surfer.example.test/";
  const id = "a".repeat(32);
  serve(id, {
    collection: () => Response.json({ schemaVersion: "duit-instagram-collection-api.v1", collectionId: id, eventIds: ["30", "10", "20", "40"] }),
    "event:30": () => Response.json(event(30)),
    "event:20": () => Response.json(event(20, { eventStatus: "PENDING", eventStatusGroup: "PENDING" })),
    "event:40": () => Response.json(event(40, { eventStatus: "FINISHED", eventStatusGroup: "FINISHED" })),
    "content:40": () => Response.json({
      schemaVersion: "duit-event-content-api.v1",
      eventId: "40",
      availability: "available",
      content: { format: "text/plain", language: "ko", body: "행사 자료를 정리했어요.", generatedAt: "2026-10-29T00:00:00.000Z" },
    }),
  });

  const collection = await fetchInstagramCollection(id);

  assert.equal(collection.status, "ready");
  if (collection.status !== "ready") return;
  assert.deepEqual(collection.entries.map(({ position, event }) => [position, event.id]), [[1, 30], [4, 40]]);
  assert.equal(collection.entries[0].content, null);
  assert.equal(collection.entries[1].content?.body, "행사 자료를 정리했어요.");
  assert.equal(collection.hiddenCount, 2);
});

test("does not request anything for a malformed ID and maps a missing post to not found", async () => {
  process.env.SURFER_API_BASE = "https://surfer.example.test";
  const id = "b".repeat(32);
  const requested = serve(id, { collection: () => Response.json({ ok: false }, { status: 404 }) });

  assert.deepEqual(await fetchInstagramCollection("../admin"), { status: "not_found" });
  assert.deepEqual(requested, []);
  assert.deepEqual(await fetchInstagramCollection(id), { status: "not_found" });
});

test("reports an outage instead of an empty post", async () => {
  process.env.API_BASE = "https://api.example.test/api";
  process.env.SURFER_API_BASE = "https://surfer.example.test";
  const id = "c".repeat(32);
  serve(id, {
    collection: () => Response.json({ schemaVersion: "duit-instagram-collection-api.v1", collectionId: id, eventIds: ["50"] }),
    "event:50": () => new Response(null, { status: 502 }),
  });
  assert.deepEqual(await fetchInstagramCollection(id), { status: "unavailable" });

  const other = "d".repeat(32);
  serve(other, { collection: () => Response.json({ schemaVersion: "duit-instagram-collection-api.v1", collectionId: id, eventIds: ["50"] }) });
  assert.deepEqual(await fetchInstagramCollection(other), { status: "unavailable" });
});
