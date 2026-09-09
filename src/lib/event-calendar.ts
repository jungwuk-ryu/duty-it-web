const ONE_HOUR_MS = 60 * 60 * 1000;

export interface EventCalendarInput {
  eventId: number;
  title: string;
  hostName: string;
  startAt: Date;
  endAt: Date | null;
  eventUrl: string;
}

export function createEventCalendarIcs(input: EventCalendarInput, now = new Date()): string {
  const endAt = getCalendarEnd(input.startAt, input.endAt);
  const description = `주최: ${input.hostName}\n행사 상세: ${input.eventUrl}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dutyit//Event Calendar//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${input.eventId}@dutyit.net`,
    `DTSTAMP:${formatCalendarUtc(now)}`,
    `DTSTART:${formatCalendarUtc(input.startAt)}`,
    `DTEND:${formatCalendarUtc(endAt)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${input.eventUrl}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function getGoogleCalendarUrl(input: EventCalendarInput): string {
  const endAt = getCalendarEnd(input.startAt, input.endAt);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.search = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${formatCalendarUtc(input.startAt)}/${formatCalendarUtc(endAt)}`,
    details: `주최: ${input.hostName}\n행사 상세: ${input.eventUrl}`,
    ctz: "Asia/Seoul",
  }).toString();
  return url.toString();
}

export function getEventCalendarFilename(title: string): string {
  const safeTitle = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${safeTitle || "듀잇 행사"}.ics`;
}

function getCalendarEnd(startAt: Date, endAt: Date | null): Date {
  if (endAt && endAt.getTime() > startAt.getTime()) return endAt;
  return new Date(startAt.getTime() + ONE_HOUR_MS);
}

function formatCalendarUtc(value: Date): string {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const segments: string[] = [];
  let segment = "";
  let byteLength = 0;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const byteLimit = segments.length === 0 ? 75 : 74;
    if (segment && byteLength + characterBytes > byteLimit) {
      segments.push(segment);
      segment = character;
      byteLength = characterBytes;
      continue;
    }
    segment += character;
    byteLength += characterBytes;
  }
  segments.push(segment);

  return segments.map((value, index) => index === 0 ? value : ` ${value}`).join("\r\n");
}
