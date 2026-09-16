import { EventStatusLabel } from "./event-labels";
import type { Event } from "./schemas/event";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric", weekday: "short",
});
const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});

export function formatEventDateTime(value: Date): string {
  const parts = dateFormatter.formatToParts(value);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}년 ${part("month")}월 ${part("day")}일 (${part("weekday")}) ${timeFormatter.format(value)}`;
}

export function formatEventPeriod(start: Date | null, end: Date | null): string {
  if (!start && !end) return "주최 페이지에서 확인해 주세요";
  if (!start) return `${formatEventDateTime(end!)}까지`;
  if (!end || start.getTime() === end.getTime()) return formatEventDateTime(start);
  if (dayFormatter.format(start) === dayFormatter.format(end)) {
    return `${formatEventDateTime(start)} – ${timeFormatter.format(end)}`;
  }
  return `${formatEventDateTime(start)} – ${formatEventDateTime(end)}`;
}

export function getEventRecruitmentStatus(event: Event, now = new Date()): string {
  if (event.eventStatus !== "RECRUITING") return EventStatusLabel[event.eventStatus];
  if (!event.recruitmentEndAt) return "모집 중";
  const dayValue = (date: Date) => {
    const parts = dayFormatter.formatToParts(date);
    const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(part("year"), part("month") - 1, part("day"));
  };
  const days = Math.round((dayValue(event.recruitmentEndAt) - dayValue(now)) / 86_400_000);
  return days < 0 ? "신청 마감" : `모집 중 · ${days === 0 ? "D-Day" : `D-${days}`}`;
}

export function getHostEventsHref(hostId: number): string {
  return `/events?view=list&hostId=${hostId}`;
}
