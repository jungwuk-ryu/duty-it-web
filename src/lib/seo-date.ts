// The public API sends Korean LocalDateTime values without a UTC offset.
// Never let the deployment server's timezone determine their meaning.
export function getIsoDateTime(value: string | Date | null | undefined): string | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  if (!value) return null;
  const text = value.trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})?)?$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, offset] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return null;
  if (hour && (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)) return null;
  const normalized = hour ? `${text}${offset ? "" : "+09:00"}` : `${text}T00:00:00+09:00`;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function getLastModified(values: (string | Date | null | undefined)[], now = new Date()): string | undefined {
  const dates = values.map(getIsoDateTime).filter((value): value is string => value != null && Date.parse(value) <= now.getTime());
  return dates.sort().at(-1);
}

export function getKoreanDate(value: string | Date | null | undefined): string | null {
  const iso = getIsoDateTime(value);
  return iso ? new Date(Date.parse(iso) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) : null;
}

export function parseJobDeadlineDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})$/)
    ?? value.trim().match(/^(\d{4})[-.]\s*(\d{1,2})[-.]\s*(\d{1,2})\.?$/);
  if (!match) return null;
  const day = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  return getIsoDateTime(day) ? day : null;
}
