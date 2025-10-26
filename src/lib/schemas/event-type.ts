import { z } from "zod";

export const EventTypeSchema = z.enum([
    "CONFERENCE",
    "SEMINAR",
    "WEBINAR",
    "WORKSHOP",
    "CONTEST",
    "CONTINUING_EDUCATION",
    "EDUCATION",
    "ETC",
  ]).catch("ETC");

  export type EventType = z.infer<typeof EventTypeSchema>;
  
  export const EventTypeLabel: Record<EventType, string> = {
    CONFERENCE: "컨퍼런스/학술대회",
    SEMINAR: "세미나",
    WEBINAR: "웨비나",
    WORKSHOP: "워크숍",
    CONTEST: "콘테스트",
    CONTINUING_EDUCATION: "보수교육",
    EDUCATION: "교육",
    ETC: "기타",
  };
