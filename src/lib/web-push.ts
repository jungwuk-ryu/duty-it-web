import { z } from "zod";
import { NotificationIdSchema, PushTokenSchema } from "./notifications";

export const PUSH_STORAGE_KEY = "duit-web-push:v1";
export const PUSH_CHANGE_EVENT = "duit-web-push-change";
export const NOTIFICATIONS_CHANGE_EVENT = "duit-notifications-change";
export const BrowserPushRecordSchema = z.object({
    version: z.literal(1), userId: NotificationIdSchema, token: PushTokenSchema,
});
export type BrowserPushRecord = z.infer<typeof BrowserPushRecordSchema>;
export function parseBrowserPushRecord(value: string | null): BrowserPushRecord | null {
    try {
        const parsed = BrowserPushRecordSchema.safeParse(value ? JSON.parse(value) : null);
        return parsed.success ? parsed.data : null;
    } catch { return null; }
}

// Either unregistering upstream or revoking the local subscription stops delivery.
// Try both even when the API/session is unavailable; a failed API must not strand
// a signed-out browser with an active push subscription.
export async function disconnectPush(actions: { remote: () => Promise<unknown>; local: () => Promise<boolean> }) {
    const [remote, local] = await Promise.allSettled([actions.remote(), actions.local()]);
    if (remote.status === "fulfilled" || (local.status === "fulfilled" && local.value)) return;
    throw new Error("브라우저 알림을 끄지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
}

export function notificationHrefFromData(data: Record<string, unknown> | undefined): string {
    // This function is also serialized into the worker; keep it self-contained.
    const eventId = data?.eventId;
    if (typeof eventId === "string" && /^[1-9]\d*$/.test(eventId) && Number.isSafeInteger(Number(eventId))) {
        return "/events/" + Number(eventId);
    }
    const jobId = data?.jobPostingId;
    if (typeof jobId === "string" && /^[1-9]\d*$/.test(jobId) && Number.isSafeInteger(Number(jobId))) {
        return "/jobs/" + Number(jobId);
    }
    return "/notifications";
}
