import type { Event } from "@/src/lib/schemas/event";
import type { EventType } from "@/src/lib/schemas/event-type";

export const HOME_EVENT_GROUPS = [
  { id: "all", label: "전체", types: [] },
  { id: "conference", label: "학술대회", types: ["CONFERENCE"] },
  { id: "volunteer", label: "봉사", types: ["VOLUNTEER"] },
  { id: "education", label: "교육", types: ["EDUCATION", "CONTINUING_EDUCATION", "WORKSHOP", "SEMINAR", "WEBINAR", "TRAINING"] },
] as const satisfies readonly { id: string; label: string; types: readonly EventType[] }[];

export type HomeEventGroup = {
  id: typeof HOME_EVENT_GROUPS[number]["id"];
  label: string;
  href: string;
  events: Event[] | null;
};
