import "server-only";

import { cache } from "react";
import { z } from "zod";
import { EventSchema, type Event } from "../schemas/event";
import { fetchEventContent, type EventContent } from "./event-content";

export const COLLECTION_ID_PATTERN = /^[a-f0-9]{32}$/;

const EVENT_ID_PATTERN = /^[1-9][0-9]{0,19}$/;
const SURFER_API_BASE = "https://surfer.dutyit.net";

const CollectionResponseSchema = z.object({
  schemaVersion: z.literal("duit-instagram-collection-api.v1"),
  collectionId: z.string(),
  eventIds: z.array(z.string().regex(EVENT_ID_PATTERN)).min(1).max(20),
});

export type CollectionEntry = {
  /** 1-based position in the original post, kept when earlier events are hidden. */
  position: number;
  event: Event;
  content: EventContent | null;
};

export type InstagramCollection =
  | { status: "ready"; entries: CollectionEntry[]; hiddenCount: number }
  | { status: "not_found" }
  | { status: "unavailable" };

type EventRead = { status: "public"; event: Event } | { status: "hidden" } | { status: "failed" };

/**
 * Reads the events of one Instagram post. Surfer supplies only the ordered event
 * IDs; each event's public status and details come from the DuIt API, so a
 * withdrawn or pending event is never shown here.
 */
export const fetchInstagramCollection = cache(async (collectionId: string): Promise<InstagramCollection> => {
  if (!COLLECTION_ID_PATTERN.test(collectionId)) return { status: "not_found" };

  const apiBase = (process.env.SURFER_API_BASE?.trim() || SURFER_API_BASE).replace(/\/$/, "");
  let eventIds: string[];
  try {
    const response = await fetch(`${apiBase}/api/v1/public/instagram-collections/${collectionId}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "unavailable" };
    const result = CollectionResponseSchema.safeParse(await response.json());
    if (!result.success || result.data.collectionId !== collectionId) return { status: "unavailable" };
    eventIds = result.data.eventIds;
  } catch {
    return { status: "unavailable" };
  }

  const reads = await Promise.all(eventIds.map(async (id, index) => {
    const [read, content] = await Promise.all([readPublicEvent(id), fetchEventContent(id)]);
    return { position: index + 1, read, content };
  }));
  const entries = reads.flatMap(({ position, read, content }) =>
    read.status === "public" ? [{ position, event: read.event, content }] : []);
  // Without a single readable event, a DuIt API outage must not look like an empty post.
  if (!entries.length && reads.some(({ read }) => read.status === "failed")) return { status: "unavailable" };
  return { status: "ready", entries, hiddenCount: eventIds.length - entries.length };
});

async function readPublicEvent(id: string): Promise<EventRead> {
  try {
    const response = await fetch(`${process.env.API_BASE}/v2/events/${id}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 403 || response.status === 404) return { status: "hidden" };
    if (!response.ok) return { status: "failed" };
    const parsed = EventSchema.safeParse(await response.json());
    if (!parsed.success) return { status: "failed" };
    const event = parsed.data;
    if (String(event.id) !== id || event.eventStatusGroup === "PENDING" || event.eventStatus === "PENDING") {
      return { status: "hidden" };
    }
    return { status: "public", event };
  } catch {
    return { status: "failed" };
  }
}
