import { EventStatusLabel, EventTypeLabel } from "./event-labels";
import { formatEventDateTime, formatEventPeriod } from "./event-detail";
import type { Event } from "./schemas/event";
import { isHttpUrl } from "./url";
import { DEFAULT_SOCIAL_IMAGE, getBreadcrumbStructuredData, SITE_ORIGIN } from "./seo";
export { serializeJsonLd } from "./seo";

export function getEventCanonicalUrl(eventId: number): string {
  return `${SITE_ORIGIN}/events/${eventId}`;
}

export function getEventMetadataDescription(event: Event): string {
  const schedule = formatEventPeriod(event.startAt, event.endAt);
  const deadline = event.recruitmentEndAt
    ? `신청 마감 ${formatEventDateTime(event.recruitmentEndAt)}`
    : "신청 일정은 주최 페이지에서 확인";

  return `${event.title} · ${EventTypeLabel[event.eventType]} · ${EventStatusLabel[event.eventStatus]} · ${event.host.name} 주최. 행사 일시 ${schedule}. ${deadline}.`;
}

export function getEventKeywords(event: Event): string[] {
  return [event.title, event.host.name, EventTypeLabel[event.eventType], EventStatusLabel[event.eventStatus], "간호 행사"];
}

export function getEventSocialImage(event: Event): string {
  return event.thumbnail && isHttpUrl(event.thumbnail) ? event.thumbnail : DEFAULT_SOCIAL_IMAGE;
}

export function getEventPageStructuredData(event: Event) {
  // Google Event rich results require a real physical Place and postal address.
  // The public event API does not expose trustworthy location data yet, so only
  // emit valid breadcrumb markup instead of fabricating an invalid Event item.
  return getBreadcrumbStructuredData("events", event.title, getEventCanonicalUrl(event.id));
}
