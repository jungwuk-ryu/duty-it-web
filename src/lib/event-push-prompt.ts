import { z } from "zod";
import { isEventSubscription, SubscriptionEventTypeSchema, type EventSubscriptionInput, type Subscription } from "./notifications";

export const EVENT_PUSH_PROMPT_KEY = "duit-event-push-prompt:v1";
export const EVENT_PUSH_PROMPT_SESSION_KEY = "duit-event-push-prompt-session:v1";
export const EVENT_PUSH_PROMPT_DELAY = 6_000;
export const EVENT_PUSH_PROMPT_SNOOZE = 7 * 24 * 60 * 60 * 1_000;

const PromptRecordSchema = z.object({
    version: z.literal(1),
    dismissedUntil: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    pendingAllUserId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
    pendingSetupUserId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
});
export type EventPushPromptRecord = z.infer<typeof PromptRecordSchema>;
export function parseEventPushPromptRecord(value: string | null): EventPushPromptRecord {
    try {
        const parsed = PromptRecordSchema.safeParse(JSON.parse(value ?? "null"));
        if (parsed.success) return parsed.data;
    } catch { /* Invalid or obsolete preferences must not break the page. */ }
    return { version: 1, dismissedUntil: 0, pendingAllUserId: null, pendingSetupUserId: null };
}

export function isEventPushPage(pathname: string) {
    return /^\/events(?:\/[1-9]\d*)?\/?$/.test(pathname);
}

// Only first-time subscribers get defaults. A retry can finish a partially saved opt-in.
export function newEventSubscriptionInputs(subscriptions: Subscription[], resumeAllTypes = false): EventSubscriptionInput[] {
    const events = subscriptions.filter(isEventSubscription);
    if (events.length > 0 && !resumeAllTypes) return [];
    const saved = new Set(events.flatMap((item) => item.type === "EVENT_TYPE" ? [item.eventType] : []));
    return SubscriptionEventTypeSchema.options.filter((eventType) => !saved.has(eventType))
        .map((eventType) => ({ type: "EVENT_TYPE", eventType }));
}
