import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchEventContent } from "./event-content";

const originalToken = process.env.DUIT_EVENT_CONTENT_API_TOKEN;
const originalBase = process.env.SURFER_API_BASE;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalToken === undefined) delete process.env.DUIT_EVENT_CONTENT_API_TOKEN;
  else process.env.DUIT_EVENT_CONTENT_API_TOKEN = originalToken;
  if (originalBase === undefined) delete process.env.SURFER_API_BASE;
  else process.env.SURFER_API_BASE = originalBase;
  globalThis.fetch = originalFetch;
});

test("reads available event content with a server-only bearer token", async () => {
  process.env.DUIT_EVENT_CONTENT_API_TOKEN = "server-secret";
  process.env.SURFER_API_BASE = "https://surfer.example.test/";
  let request: { input: string; init?: RequestInit } | undefined;

  globalThis.fetch = async (input, init) => {
    request = { input: String(input), init };
    return Response.json({
      schemaVersion: "duit-event-content-api.v1",
      eventId: "701",
      availability: "available",
      content: {
        format: "text/plain",
        language: "ko",
        body: "행사 자료를 바탕으로 정리한 내용입니다.",
        generatedAt: "2026-09-09T12:00:00.000Z",
      },
    });
  };

  const content = await fetchEventContent("701");

  assert.equal(content?.body, "행사 자료를 바탕으로 정리한 내용입니다.");
  assert.equal(request?.input, "https://surfer.example.test/api/v1/duit-events/701/content");
  assert.equal(new Headers(request?.init?.headers).get("Authorization"), "Bearer server-secret");
});

test("omits the section when Surfer has no generated content", async () => {
  process.env.DUIT_EVENT_CONTENT_API_TOKEN = "server-secret";
  globalThis.fetch = async () => Response.json({
    schemaVersion: "duit-event-content-api.v1",
    eventId: "702",
    availability: "unavailable",
    content: null,
  });

  assert.equal(await fetchEventContent("702"), null);
});

test("does not call Surfer without a configured server token", async () => {
  delete process.env.DUIT_EVENT_CONTENT_API_TOKEN;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({});
  };

  assert.equal(await fetchEventContent("703"), null);
  assert.equal(called, false);
});

test("fails open when Surfer returns an invalid or failed response", async () => {
  process.env.DUIT_EVENT_CONTENT_API_TOKEN = "server-secret";
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  assert.equal(await fetchEventContent("704"), null);

  globalThis.fetch = async () => Response.json({ availability: "available" });
  assert.equal(await fetchEventContent("705"), null);
});
