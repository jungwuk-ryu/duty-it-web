import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  getViewGuardBucketCountForTests,
  guardViewCountRequest,
  normalizeViewEventId,
  resetViewGuardForTests,
} from "./viewGuard.ts";

const headers = new Headers({
  "x-forwarded-for": "203.0.113.10",
  "user-agent": "view-guard-test",
});

beforeEach(() => {
  resetViewGuardForTests();
});

test("normalizes only positive safe integer event IDs", () => {
  assert.equal(normalizeViewEventId(123), "123");
  assert.equal(normalizeViewEventId(" 123 "), "123");
  assert.equal(normalizeViewEventId("0"), null);
  assert.equal(normalizeViewEventId("-1"), null);
  assert.equal(normalizeViewEventId("abc"), null);
  assert.equal(normalizeViewEventId(Number.MAX_SAFE_INTEGER + 1), null);
});

test("suppresses repeated views for the same client and event", () => {
  assert.deepEqual(guardViewCountRequest("123", headers, 1_000), {
    allowed: true,
    eventId: "123",
  });

  assert.deepEqual(guardViewCountRequest("123", headers, 2_000), {
    allowed: false,
    eventId: "123",
    reason: "duplicate_view",
    status: 202,
  });

  assert.deepEqual(guardViewCountRequest("123", headers, 601_000), {
    allowed: true,
    eventId: "123",
  });
});

test("does not let user-agent rotation bypass duplicate suppression", () => {
  const firstHeaders = new Headers({
    "x-forwarded-for": "203.0.113.20",
    "user-agent": "first-agent",
  });
  const rotatedHeaders = new Headers({
    "x-forwarded-for": "203.0.113.20",
    "user-agent": "rotated-agent",
  });

  assert.equal(guardViewCountRequest("123", firstHeaders, 1_000).allowed, true);
  assert.deepEqual(guardViewCountRequest("123", rotatedHeaders, 2_000), {
    allowed: false,
    eventId: "123",
    reason: "duplicate_view",
    status: 202,
  });
});

test("rate limits excessive unique view requests per client", () => {
  for (let eventId = 1; eventId <= 30; eventId += 1) {
    assert.equal(guardViewCountRequest(eventId, headers, 1_000).allowed, true);
  }

  assert.deepEqual(guardViewCountRequest(31, headers, 1_000), {
    allowed: false,
    eventId: "31",
    reason: "rate_limited",
    status: 429,
  });
});

test("expires idle client buckets", () => {
  const firstHeaders = new Headers({ "x-forwarded-for": "203.0.113.30" });
  const secondHeaders = new Headers({ "x-forwarded-for": "203.0.113.31" });
  const thirdHeaders = new Headers({ "x-forwarded-for": "203.0.113.32" });

  assert.equal(guardViewCountRequest(1, firstHeaders, 1_000).allowed, true);
  assert.equal(guardViewCountRequest(2, secondHeaders, 1_000).allowed, true);
  assert.equal(getViewGuardBucketCountForTests(), 2);

  assert.equal(guardViewCountRequest(3, thirdHeaders, 601_000).allowed, true);
  assert.equal(getViewGuardBucketCountForTests(), 1);
});
