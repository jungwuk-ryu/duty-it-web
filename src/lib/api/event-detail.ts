import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { EventSchema } from "../schemas/event";
import { normalizeViewEventId } from "./viewGuard";

// Shared by the route and metadata. Reading details must never increment views.
export const fetchEventDetail = cache(async (id: string) => {
  const eventId = normalizeViewEventId(id);
  if (!eventId) notFound();
  // Revalidated like the event lists so most requests skip the API round trip; status and views may lag by up to 60s.
  const response = await fetch(`${process.env.API_BASE}/v2/events/${eventId}`, {
    next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("행사 정보를 불러오지 못했어요.");
  const event = EventSchema.parse(await response.json());
  if (event.eventStatusGroup === "PENDING" || event.eventStatus === "PENDING") notFound();
  return event;
});
