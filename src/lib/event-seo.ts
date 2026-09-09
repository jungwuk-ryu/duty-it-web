import { EventStatusLabel, EventTypeLabel } from "./event-labels";
import { formatEventDateTime, formatEventPeriod, getHostEventsHref } from "./event-detail";
import type { Event } from "./schemas/event";
import { isHttpUrl } from "./url";

const SITE_ORIGIN = "https://www.dutyit.net";
const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/og/default-1200x630.png`;
const jsonLdDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

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

export function getEventStructuredData(event: Event) {
  const canonicalUrl = getEventCanonicalUrl(event.id);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${canonicalUrl}#event`,
    name: event.title,
    description: getEventMetadataDescription(event),
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    image: [getEventSocialImage(event)],
    inLanguage: "ko-KR",
    keywords: getEventKeywords(event),
    startDate: formatJsonLdDateTime(event.startAt),
    ...(event.endAt ? { endDate: formatJsonLdDateTime(event.endAt) } : {}),
    organizer: {
      "@type": "Organization",
      name: event.host.name,
      url: new URL(getHostEventsHref(event.host.id), SITE_ORIGIN).toString(),
      ...(event.host.thumbnail && isHttpUrl(event.host.thumbnail) ? { logo: event.host.thumbnail } : {}),
    },
    eventStatus: "https://schema.org/EventScheduled",
    ...(event.eventStatusGroup === "ACTIVE"
      ? {
          potentialAction: {
            "@type": "RegisterAction",
            name: "주최 페이지에서 행사 확인",
            target: event.uri,
          },
        }
      : {}),
    sameAs: event.uri,
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function formatJsonLdDateTime(value: Date): string {
  const parts = jsonLdDateFormatter.formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}+09:00`;
}
