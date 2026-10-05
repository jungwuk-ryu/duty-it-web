import assert from "node:assert/strict";
import test from "node:test";
import { getEventDday } from "./event-dday";

test("event countdown changes at Korean midnight, not after 24 elapsed hours", () => {
  const startAt = new Date("2026-10-01T00:30:00+09:00");
  assert.equal(getEventDday(startAt, new Date("2026-09-30T14:59:59Z")), "D-1");
  assert.equal(getEventDday(startAt, new Date("2026-09-30T15:00:00Z")), "D-Day");
  assert.equal(getEventDday(startAt, new Date("2026-10-01T15:00:00Z")), "D+1");
});

test("event countdown crosses month and year boundaries and rejects invalid dates", () => {
  assert.equal(getEventDday(new Date("2027-01-01T10:00:00+09:00"), new Date("2026-11-17T10:00:00+09:00")), "D-45");
  assert.equal(getEventDday(new Date("invalid"), new Date()), null);
  assert.equal(getEventDday(new Date(), new Date("invalid")), null);
});
