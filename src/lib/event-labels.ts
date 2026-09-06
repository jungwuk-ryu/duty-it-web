import type { EventStatus, EventStatusGroup } from "@/src/lib/schemas/event-status";
import type { EventType } from "@/src/lib/schemas/event-type";

export const EventStatusLabel: Record<EventStatus, string> = {
    FINISHED: "종료",
    ACTIVE: "진행 중",
    EVENT_WAITING: "시작 대기",
    RECRUITING: "모집 중",
    RECRUITMENT_WAITING: "모집 대기",
    PENDING: "승인 대기",
};

export const EventStatusGroupLabel: Record<EventStatusGroup, string> = {
    PENDING: "승인 대기",
    ACTIVE: "예정/진행",
    FINISHED: "종료",
};

export const EventTypeLabel: Record<EventType, string> = {
    CONFERENCE: "컨퍼런스/학술대회",
    SEMINAR: "세미나",
    WEBINAR: "웨비나",
    WORKSHOP: "워크숍",
    CONTEST: "콘테스트",
    CONTINUING_EDUCATION: "보수교육",
    EDUCATION: "교육",
    VOLUNTEER: "봉사",
    TRAINING: "연수",
    SUPPORTERS: "서포터즈",
    ETC: "기타",
};
