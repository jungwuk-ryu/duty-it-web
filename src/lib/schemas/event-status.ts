import { z } from "zod";

export const EventStatusSchema = z.enum([
    "FINISHED",
    "ACTIVE",
    "EVENT_WAITING",
    "RECRUITING",
    "RECRUITMENT_WAITING",
    "PENDING",
]).catch("EVENT_WAITING");

export type EventStatus = z.infer<typeof EventStatusSchema>;

export const EventStatusLabel: Record<EventStatus, string> = {
    FINISHED: "종료",
    ACTIVE: "진행 중",
    EVENT_WAITING: "시작 대기",
    RECRUITING: "모집 중",
    RECRUITMENT_WAITING: "모집 대기",
    PENDING: "승인 대기",
};

export const EventStatusGroupSchema = z.enum([
    "PENDING",
    "ACTIVE",
    "FINISHED",
]).catch("ACTIVE");

export type EventStatusGroup = z.infer<typeof EventStatusGroupSchema>;

export const EventStatusGroupLabel: Record<EventStatusGroup, string> = {
    PENDING: "승인 대기",
    ACTIVE: "예정/진행",
    FINISHED: "종료",
};
