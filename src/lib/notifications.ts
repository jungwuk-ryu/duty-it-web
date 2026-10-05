import { z } from "zod";
import { EventTypeSchema, EventTypeLabel } from "./schemas/event-type";

export const NotificationIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const NotificationPathIdSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(NotificationIdSchema);
// Inputs must reject unknown types rather than using the display schema's ETC fallback.
export const SubscriptionEventTypeSchema = EventTypeSchema.unwrap();
export const EVENT_SUBSCRIPTION_TYPES = ["EVENT_TYPE", "EVENT_KEYWORD", "EVENT_HOST"] as const;

export const EventSubscriptionInputSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("EVENT_TYPE"), eventType: SubscriptionEventTypeSchema }).strict(),
    z.object({ type: z.literal("EVENT_KEYWORD"), keyword: z.string().trim().min(1).max(50) }).strict(),
    z.object({ type: z.literal("EVENT_HOST"), hostId: NotificationIdSchema }).strict(),
]);
export type EventSubscriptionInput = z.infer<typeof EventSubscriptionInputSchema>;

const subscriptionBase = { id: NotificationIdSchema, createdAt: z.string() };
const targetSummary = z.object({ id: NotificationIdSchema, name: z.string() });
export const SubscriptionSchema = z.discriminatedUnion("type", [
    z.object({ ...subscriptionBase, type: z.literal("EVENT_TYPE"), eventType: SubscriptionEventTypeSchema }),
    z.object({ ...subscriptionBase, type: z.literal("EVENT_KEYWORD"), keyword: z.string() }),
    z.object({ ...subscriptionBase, type: z.literal("EVENT_HOST"), host: targetSummary }),
    z.object({ ...subscriptionBase, type: z.literal("JOB_KEYWORD"), keyword: z.string() }),
    z.object({ ...subscriptionBase, type: z.literal("JOB_COMPANY"), company: targetSummary.extend({ name: z.string().nullable() }) }),
]);
export const SubscriptionsSchema = z.array(SubscriptionSchema);
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type EventSubscription = Extract<Subscription, { type: typeof EVENT_SUBSCRIPTION_TYPES[number] }>;
export function isEventSubscription(subscription: Subscription): subscription is EventSubscription {
    return subscription.type === "EVENT_TYPE" || subscription.type === "EVENT_KEYWORD" || subscription.type === "EVENT_HOST";
}
export function subscriptionLabel(subscription: EventSubscription) {
    if (subscription.type === "EVENT_TYPE") return EventTypeLabel[subscription.eventType];
    if (subscription.type === "EVENT_HOST") return subscription.host.name;
    return subscription.keyword;
}

export const PageInfoSchema = z.object({
    pageNumber: z.number().int().nonnegative(), pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(), totalElements: z.number().int().nonnegative(),
});
export const AlarmTypeSchema = z.enum([
    "EVENT_START", "RECRUITMENT_START", "RECRUITMENT_END",
    "EVENT_SUBSCRIPTION_KEYWORD", "EVENT_SUBSCRIPTION_HOST", "EVENT_SUBSCRIPTION_TYPE",
    "JOB_SUBSCRIPTION_KEYWORD", "JOB_SUBSCRIPTION_COMPANY",
]);
export const AlarmSchema = z.object({
    id: NotificationIdSchema, type: AlarmTypeSchema, isRead: z.boolean(), createdAt: z.string(),
    target: z.discriminatedUnion("targetType", [
        z.object({ targetType: z.literal("EVENT"), event: z.object({
            id: NotificationIdSchema, title: z.string(), host: z.object({ name: z.string() }),
        }) }),
        z.object({ targetType: z.literal("JOB_POSTING"), jobPosting: z.object({
            id: NotificationIdSchema, wantedTitle: z.string().nullish(), corpNm: z.string().nullish(),
        }) }),
    ]),
});
export const AlarmsPageSchema = z.object({ content: z.array(AlarmSchema), pageInfo: PageInfoSchema });
const reasons: Record<z.infer<typeof AlarmTypeSchema>, string> = {
    EVENT_START: "행사 시작", RECRUITMENT_START: "신청 시작", RECRUITMENT_END: "신청 마감",
    EVENT_SUBSCRIPTION_KEYWORD: "구독한 키워드의 새 행사",
    EVENT_SUBSCRIPTION_HOST: "구독한 주최자의 새 행사",
    EVENT_SUBSCRIPTION_TYPE: "구독한 유형의 새 행사",
    JOB_SUBSCRIPTION_KEYWORD: "구독한 키워드의 새 채용 공고",
    JOB_SUBSCRIPTION_COMPANY: "구독한 회사의 새 채용 공고",
};
export function summarizeAlarm(alarm: z.infer<typeof AlarmSchema>) {
    const event = alarm.target.targetType === "EVENT" ? alarm.target.event : null;
    const job = alarm.target.targetType === "JOB_POSTING" ? alarm.target.jobPosting : null;
    return {
        id: alarm.id, reason: reasons[alarm.type], isRead: alarm.isRead, createdAt: alarm.createdAt,
        title: event?.title ?? job?.wantedTitle ?? "채용 공고",
        description: event?.host.name ?? job?.corpNm ?? "",
        href: event ? "/events/" + event.id : "/jobs/" + job!.id,
    };
}
export const NotificationSummarySchema = z.object({
    id: NotificationIdSchema, reason: z.string(), isRead: z.boolean(), createdAt: z.string(),
    title: z.string(), description: z.string(), href: z.string().regex(/^\/(?:events|jobs)\/[1-9]\d*$/),
});
export type NotificationSummary = z.infer<typeof NotificationSummarySchema>;
export const NotificationsPageSchema = z.object({
    content: z.array(NotificationSummarySchema), next: z.number().int().nonnegative().nullable(),
    totalElements: z.number().int().nonnegative(),
});
export const NotificationsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100_000)).default(0),
    size: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(50)).default(20),
    unread: z.enum(["true", "false"]).optional(),
});
export const PushTokenSchema = z.string().min(1).max(512).regex(/^[A-Za-z0-9_:-]+$/).refine((value) => value !== "null");
export const PushTokenInputSchema = z.object({ token: PushTokenSchema }).strict();

export function formatNotificationDate(value: string) {
    const date = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value) ? value + "+09:00" : value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(date);
}
