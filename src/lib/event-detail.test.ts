import assert from "node:assert/strict";
import { test } from "node:test";
import { formatEventDateTime, formatEventPeriod, getHostEventsHref } from "./event-detail";
import { EventSchema } from "./schemas/event";

test("event detail times use Korea time across UTC date boundaries", () => {
  assert.equal(formatEventDateTime(new Date("2026-10-21T15:00:00Z")), "2026년 10월 22일 (목) 00:00");
});
test("same-day schedules retain both times without repeating the date", () => {
  assert.equal(formatEventPeriod(new Date("2026-10-22T00:00:00Z"), new Date("2026-10-22T08:30:00Z")), "2026년 10월 22일 (목) 09:00 – 17:30");
});
test("multi-day schedules retain both dates and times", () => {
  assert.equal(formatEventPeriod(new Date("2026-10-22T00:00:00Z"), new Date("2026-10-23T08:30:00Z")), "2026년 10월 22일 (목) 09:00 – 2026년 10월 23일 (금) 17:30");
});
test("missing recruitment dates do not invent an application period", () => {
  assert.equal(formatEventPeriod(null, null), "주최 페이지에서 확인해 주세요");
  assert.equal(formatEventPeriod(null, new Date("2026-10-18T14:59:00Z")), "2026년 10월 18일 (일) 23:59까지");
});
test("the API's offset-free timestamps retain their original Korean time", () => {
  const date = EventSchema.shape.startAt.parse("2026-10-22T09:00:00");
  assert.equal(formatEventDateTime(date), "2026년 10월 22일 (목) 09:00");
});
test("host navigation opens the filtered event list", () => {
  assert.equal(getHostEventsHref(313), "/events?view=list&hostId=313");
});
