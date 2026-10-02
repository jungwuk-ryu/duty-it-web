import { getKoreanDate } from "./seo-date";

/** Calendar days until the event starts, independent of the browser timezone. */
export function getEventDday(startAt: Date, now: Date): string | null {
  const startDay = getKoreanDate(startAt);
  const today = getKoreanDate(now);
  if (!startDay || !today) return null;

  const days = Math.round((Date.parse(startDay) - Date.parse(today)) / 86_400_000);
  if (days === 0) return "D-Day";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}
