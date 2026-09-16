import "server-only";

import { cache } from "react";
import { z } from "zod";
import { normalizeViewEventId } from "./viewGuard";

const EventContentResponseSchema = z.discriminatedUnion("availability", [
  z.object({
    schemaVersion: z.literal("duit-event-content-api.v1"),
    eventId: z.string(),
    availability: z.literal("available"),
    content: z.object({
      format: z.literal("text/plain"),
      language: z.literal("ko"),
      body: z.string().trim().min(1),
      generatedAt: z.string().datetime(),
    }),
  }),
  z.object({
    schemaVersion: z.literal("duit-event-content-api.v1"),
    eventId: z.string(),
    availability: z.literal("unavailable"),
    content: z.null(),
  }),
]);

export type EventContent = Extract<
  z.infer<typeof EventContentResponseSchema>,
  { availability: "available" }
>["content"];

const SURFER_API_BASE = "https://surfer.dutyit.net";

/**
 * Reads AI-generated event content through the server-only Surfer API.
 * Missing content and upstream failures are intentionally non-fatal because
 * only a subset of DuIt events has generated content.
 */
export const fetchEventContent = cache(async (id: string): Promise<EventContent | null> => {
  const eventId = normalizeViewEventId(id);
  const token = process.env.DUIT_EVENT_CONTENT_API_TOKEN?.trim();
  if (!eventId || !token) return null;

  const apiBase = (process.env.SURFER_API_BASE?.trim() || SURFER_API_BASE).replace(/\/$/, "");

  try {
    const response = await fetch(`${apiBase}/api/v1/duit-events/${eventId}/content`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return null;

    const result = EventContentResponseSchema.safeParse(await response.json());
    if (!result.success || result.data.eventId !== String(eventId)) return null;
    return result.data.availability === "available" ? result.data.content : null;
  } catch {
    return null;
  }
});
