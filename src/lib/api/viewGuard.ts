import { createHash } from "crypto";

const VIEW_WINDOW_MS = 60_000;
const VIEW_REPEAT_COOLDOWN_MS = 10 * 60_000;
const VIEW_MAX_REQUESTS_PER_WINDOW = 30;
const VIEW_BUCKET_TTL_MS = VIEW_REPEAT_COOLDOWN_MS;
const VIEW_MAX_BUCKETS = 5_000;

type ViewBucket = {
  windowStartedAt: number;
  lastSeenAt: number;
  requestCount: number;
  seenEvents: Map<string, number>;
};

type ViewGuardBlockedReason = "invalid_event_id" | "duplicate_view" | "rate_limited";

type ViewGuardAllowed = {
  allowed: true;
  eventId: string;
};

type ViewGuardBlocked = {
  allowed: false;
  eventId: string | null;
  reason: ViewGuardBlockedReason;
  status: 400 | 202 | 429;
};

export type ViewGuardResult = ViewGuardAllowed | ViewGuardBlocked;

const buckets = new Map<string, ViewBucket>();
let lastBucketCleanupAt = 0;

export function normalizeViewEventId(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;

  return String(parsed);
}

export function getViewClientKey(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const cfConnectingIp = headers.get("cf-connecting-ip")?.trim();
  const clientAddress = cfConnectingIp || realIp || forwardedFor || "unknown-address";

  return createHash("sha256")
    .update(clientAddress)
    .digest("hex");
}

export function guardViewCountRequest(
  eventId: unknown,
  headers: Headers,
  now = Date.now(),
): ViewGuardResult {
  const normalizedEventId = normalizeViewEventId(eventId);
  if (normalizedEventId == null) {
    return {
      allowed: false,
      eventId: null,
      reason: "invalid_event_id",
      status: 400,
    };
  }

  const clientKey = getViewClientKey(headers);
  const bucket = getOrCreateBucket(clientKey, now);
  pruneSeenEvents(bucket, now);

  const lastSeenAt = bucket.seenEvents.get(normalizedEventId);
  if (lastSeenAt != null && now - lastSeenAt < VIEW_REPEAT_COOLDOWN_MS) {
    return {
      allowed: false,
      eventId: normalizedEventId,
      reason: "duplicate_view",
      status: 202,
    };
  }

  if (bucket.requestCount >= VIEW_MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      eventId: normalizedEventId,
      reason: "rate_limited",
      status: 429,
    };
  }

  bucket.requestCount += 1;
  bucket.seenEvents.set(normalizedEventId, now);

  return {
    allowed: true,
    eventId: normalizedEventId,
  };
}

export function resetViewGuardForTests() {
  buckets.clear();
  lastBucketCleanupAt = 0;
}

export function getViewGuardBucketCountForTests() {
  return buckets.size;
}

function getOrCreateBucket(clientKey: string, now: number): ViewBucket {
  cleanupBuckets(now);

  const existing = buckets.get(clientKey);
  if (existing == null || now - existing.windowStartedAt >= VIEW_WINDOW_MS) {
    const bucket: ViewBucket = {
      windowStartedAt: now,
      lastSeenAt: now,
      requestCount: 0,
      seenEvents: new Map(),
    };
    buckets.set(clientKey, bucket);
    return bucket;
  }

  existing.lastSeenAt = now;
  return existing;
}

function pruneSeenEvents(bucket: ViewBucket, now: number) {
  for (const [eventId, seenAt] of bucket.seenEvents.entries()) {
    if (now - seenAt >= VIEW_REPEAT_COOLDOWN_MS) {
      bucket.seenEvents.delete(eventId);
    }
  }
}

function cleanupBuckets(now: number) {
  if (now - lastBucketCleanupAt < VIEW_WINDOW_MS && buckets.size <= VIEW_MAX_BUCKETS) {
    return;
  }

  lastBucketCleanupAt = now;

  for (const [clientKey, bucket] of buckets.entries()) {
    if (now - bucket.lastSeenAt >= VIEW_BUCKET_TTL_MS) {
      buckets.delete(clientKey);
    }
  }

  if (buckets.size <= VIEW_MAX_BUCKETS) return;

  const oldestBuckets = [...buckets.entries()]
    .sort(([, left], [, right]) => left.lastSeenAt - right.lastSeenAt)
    .slice(0, buckets.size - VIEW_MAX_BUCKETS);

  for (const [clientKey] of oldestBuckets) {
    buckets.delete(clientKey);
  }
}
