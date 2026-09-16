import assert from "node:assert/strict";
import { test } from "node:test";
import { getEventMetadataDescription, getEventStructuredData, serializeJsonLd } from "./event-seo";
import type { Event } from "./schemas/event";

const event: Event = {
  id: 727,
  title: "의료 사각지대 의료봉사 9월 충남 성주",
  startAt: new Date("2026-09-18T00:00:00.000Z"),
  endAt: new Date("2026-09-18T07:00:00.000Z"),
  recruitmentStartAt: new Date("2026-08-31T15:00:00.000Z"),
  recruitmentEndAt: new Date("2026-09-14T14:59:00.000Z"),
  uri: "https://example.com/events/727",
  thumbnail: "https://api.dutyit.net/uploads/events/poster.webp",
  eventType: "VOLUNTEER",
  eventStatus: "RECRUITING",
  eventStatusGroup: "ACTIVE",
  host: { id: 42, name: "대한의료봉사회", thumbnail: null },
  viewCount: 31,
  isBookmarked: false,
};

test("event metadata describes its type, organizer, schedule, and application deadline", () => {
  const description = getEventMetadataDescription(event);

  assert.match(description, /봉사/);
  assert.match(description, /모집 중/);
  assert.match(description, /대한의료봉사회 주최/);
  assert.match(description, /2026년 9월 18일 \(금\) 09:00 – 16:00/);
  assert.match(description, /신청 마감 2026년 9월 14일 \(월\) 23:59/);
});

test("event JSON-LD exposes canonical, schedule, organizer, poster, and source URL", () => {
  const data = getEventStructuredData(event);

  assert.equal(data["@type"], "Event");
  assert.equal(data.url, "https://www.dutyit.net/events/727");
  assert.equal(data.startDate, "2026-09-18T09:00:00+09:00");
  assert.equal(data.endDate, "2026-09-18T16:00:00+09:00");
  assert.deepEqual(data.organizer, {
    "@type": "Organization",
    name: "대한의료봉사회",
    url: "https://www.dutyit.net/events?view=list&hostId=42",
  });
  assert.deepEqual(data.image, [event.thumbnail]);
  assert.deepEqual(data.keywords, [event.title, event.host.name, "봉사", "모집 중", "간호 행사"]);
  assert.equal(data.sameAs, event.uri);
});

test("JSON-LD serialization prevents event text from closing the script element", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

  assert.doesNotMatch(serialized, /</);
  assert.match(serialized, /\\u003c\/script>/);
});
