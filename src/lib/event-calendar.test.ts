import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEventCalendarIcs,
  getEventCalendarFilename,
  getGoogleCalendarUrl,
  type EventCalendarInput,
} from "./event-calendar";

const event: EventCalendarInput = {
  eventId: 727,
  title: "간호, 세미나; 실무",
  hostName: "대한의료봉사회",
  startAt: new Date("2026-09-18T00:00:00.000Z"),
  endAt: new Date("2026-09-18T07:00:00.000Z"),
  eventUrl: "https://www.dutyit.net/events/727",
};

test("calendar files contain the complete event schedule and escaped text", () => {
  const ics = createEventCalendarIcs(event, new Date("2026-09-09T12:00:00.000Z"));
  const unfolded = ics.replace(/\r\n /g, "");

  assert.match(unfolded, /DTSTART:20260918T000000Z\r\n/);
  assert.match(unfolded, /DTEND:20260918T070000Z\r\n/);
  assert.match(unfolded, /SUMMARY:간호\\, 세미나\\; 실무\r\n/);
  assert.match(unfolded, /DESCRIPTION:주최: 대한의료봉사회\\n행사 상세: https:\/\/www\.dutyit\.net\/events\/727\r\n/);
  assert.match(unfolded, /URL:https:\/\/www\.dutyit\.net\/events\/727\r\n/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));
});

test("calendar files default to a one-hour event when an end time is unavailable", () => {
  const ics = createEventCalendarIcs({ ...event, endAt: null });
  assert.match(ics, /DTEND:20260918T010000Z\r\n/);
});

test("Google Calendar links preserve the schedule, Korea timezone, and event details", () => {
  const url = new URL(getGoogleCalendarUrl(event));

  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), event.title);
  assert.equal(url.searchParams.get("dates"), "20260918T000000Z/20260918T070000Z");
  assert.equal(url.searchParams.get("ctz"), "Asia/Seoul");
  assert.match(url.searchParams.get("details") ?? "", /대한의료봉사회/);
  assert.match(url.searchParams.get("details") ?? "", /https:\/\/www\.dutyit\.net\/events\/727/);
});

test("calendar filenames remove characters Windows and macOS cannot save", () => {
  assert.equal(getEventCalendarFilename('간호: 실무/교육? "2026"'), "간호 실무교육 2026.ics");
});
