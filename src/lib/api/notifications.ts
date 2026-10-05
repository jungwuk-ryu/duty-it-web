import "server-only";
import { AuthError, upstreamFetch } from "../auth/server";
import {
    AlarmsPageSchema, EventSubscriptionInputSchema, NotificationPathIdSchema, NotificationsQuerySchema,
    PushTokenInputSchema, SubscriptionSchema, SubscriptionsSchema, isEventSubscription, summarizeAlarm,
} from "../notifications";

export async function fetchNotifications(accessToken: string, query: URLSearchParams) {
    const parsed = NotificationsQuerySchema.safeParse(Object.fromEntries(query));
    if (!parsed.success) throw new AuthError("알림 목록 요청을 확인해 주세요.", 400);
    const { page, size, unread } = parsed.data;
    const params = new URLSearchParams({ page: String(page), size: String(size), field: "ID", sortDirection: "DESC" });
    if (unread === "true") params.set("isRead", "false");
    const response = await upstreamFetch("/v2/alarms?" + params, accessToken);
    const result = AlarmsPageSchema.parse(await response.json());
    return {
        content: result.content.map(summarizeAlarm),
        next: page + 1 < result.pageInfo.totalPages ? page + 1 : null,
        totalElements: result.pageInfo.totalElements,
    };
}
export async function fetchEventSubscriptions(accessToken: string) {
    const response = await upstreamFetch("/v1/subscriptions", accessToken);
    return SubscriptionsSchema.parse(await response.json()).filter(isEventSubscription);
}
export async function createEventSubscription(accessToken: string, body: unknown) {
    const parsed = EventSubscriptionInputSchema.safeParse(body);
    if (!parsed.success) throw new AuthError("구독 조건을 확인해 주세요. 키워드는 1~50자로 입력해 주세요.", 400);
    const response = await upstreamFetch("/v1/subscriptions", accessToken, "POST", JSON.stringify(parsed.data));
    const result = SubscriptionSchema.parse(await response.json());
    if (!isEventSubscription(result)) throw new AuthError("구독 결과를 확인하지 못했어요.", 502);
    return result;
}
export async function deleteEventSubscription(accessToken: string, rawId: string) {
    const id = NotificationPathIdSchema.safeParse(rawId);
    if (!id.success) throw new AuthError("구독 정보를 확인해 주세요.", 400);
    // This web surface owns event subscriptions only; preserve job subscriptions.
    const subscriptions = await fetchEventSubscriptions(accessToken);
    if (!subscriptions.some((item) => item.id === id.data)) throw new AuthError("구독 정보를 찾을 수 없습니다.", 404);
    await upstreamFetch("/v1/subscriptions/" + id.data, accessToken, "DELETE");
}
export async function readNotification(accessToken: string, rawId: string) {
    const id = NotificationPathIdSchema.safeParse(rawId);
    if (!id.success) throw new AuthError("알림 정보를 확인해 주세요.", 400);
    await upstreamFetch("/v1/alarms/" + id.data + "/read", accessToken, "PATCH");
}
export async function readAllNotifications(accessToken: string) {
    await upstreamFetch("/v1/alarms/read-all", accessToken, "PATCH");
}
export async function updatePushToken(accessToken: string, body: unknown, method: "PATCH" | "DELETE") {
    const parsed = PushTokenInputSchema.safeParse(body);
    if (!parsed.success) throw new AuthError("브라우저 알림 정보를 확인해 주세요.", 400);
    await upstreamFetch("/v1/users/device/" + encodeURIComponent(parsed.data.token), accessToken, method);
}
