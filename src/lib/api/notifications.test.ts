import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { AuthError } from "../auth/server.ts";
import {
    createEventSubscription, deleteEventSubscription, fetchEventSubscriptions, fetchNotifications,
    readAllNotifications, updatePushToken,
} from "./notifications.ts";

const originalBase = process.env.API_BASE;
const subscription = { id: 1, type: "EVENT_TYPE", eventType: "VOLUNTEER", createdAt: "2026-10-05T10:00:00" };
beforeEach(() => { process.env.API_BASE = "https://api.example.test/api"; });
afterEach(() => {
    mock.restoreAll();
    if (originalBase === undefined) delete process.env.API_BASE;
    else process.env.API_BASE = originalBase;
});

test("notification proxy reads mixed event/job targets and forwards private authentication only upstream", async () => {
    mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        const url = new URL(input);
        assert.equal(url.pathname, "/api/v2/alarms");
        assert.equal(url.searchParams.get("isRead"), "false");
        assert.equal(url.searchParams.get("sortDirection"), "DESC");
        assert.equal((init.headers as Record<string, string>).Authorization, "Bearer secret-access");
        assert.equal(init.cache, "no-store");
        return Response.json({
            content: [
                { id: 2, type: "EVENT_SUBSCRIPTION_TYPE", isRead: false, createdAt: "2026-10-05T10:00:00",
                    target: { targetType: "EVENT", event: { id: 44, title: "봉사 행사", host: { name: "간호협회" }, uri: "https://evil.test" } }, accessToken: "must-not-leak" },
                { id: 1, type: "JOB_SUBSCRIPTION_COMPANY", isRead: false, createdAt: "2026-10-05T09:00:00",
                    target: { targetType: "JOB_POSTING", jobPosting: { id: 9, wantedTitle: null, corpNm: "병원" } } },
            ],
            pageInfo: { pageNumber: 0, pageSize: 20, totalElements: 22, totalPages: 2 },
        });
    });
    const result = await fetchNotifications("secret-access", new URLSearchParams({ unread: "true" }));
    assert.equal(result.next, 1);
    assert.equal(result.totalElements, 22);
    assert.equal(result.content[0].href, "/events/44");
    assert.equal(result.content[1].href, "/jobs/9");
    assert.equal(result.content[1].title, "채용 공고");
    assert.doesNotMatch(JSON.stringify(result), /must-not-leak|secret-access|evil\.test/);
});

test("invalid notification pagination never reaches the upstream API", async () => {
    const spy = mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected API request"); });
    for (const query of ["page=-1", "page=100001", "size=1000", "page=1.2", "unread=invalid"]) {
        await assert.rejects(fetchNotifications("access", new URLSearchParams(query)), (error: unknown) => error instanceof AuthError && error.status === 400);
    }
    assert.equal(spy.mock.callCount(), 0);
});

test("event subscription settings preserve job subscriptions and reject deleting one", async () => {
    const spy = mock.method(globalThis, "fetch", async (_input: string, init: RequestInit) => {
        assert.equal(init.method, "GET");
        return Response.json([subscription, { id: 8, type: "JOB_KEYWORD", keyword: "간호사", createdAt: "2026-10-05T10:00:00" }]);
    });
    assert.deepEqual(await fetchEventSubscriptions("access"), [subscription]);
    await assert.rejects(deleteEventSubscription("access", "8"), (error: unknown) => error instanceof AuthError && error.status === 404);
    assert.equal(spy.mock.callCount(), 2);
});

test("subscription creation validates type-specific fields and trims keywords", async () => {
    const spy = mock.method(globalThis, "fetch", async (_input: string, init: RequestInit) => {
        assert.deepEqual(JSON.parse(String(init.body)), { type: "EVENT_KEYWORD", keyword: "간호 연구" });
        return Response.json({ id: 3, type: "EVENT_KEYWORD", keyword: "간호 연구", createdAt: "2026-10-05T10:00:00" });
    });
    for (const body of [
        { type: "EVENT_TYPE", eventType: "UNKNOWN" }, { type: "EVENT_KEYWORD", keyword: " " },
        { type: "EVENT_KEYWORD", keyword: "a".repeat(51) }, { type: "EVENT_HOST", hostId: 0 },
        { type: "JOB_KEYWORD", keyword: "간호사" }, { type: "EVENT_TYPE", eventType: "VOLUNTEER", hostId: 1 },
    ]) await assert.rejects(createEventSubscription("access", body), AuthError);
    assert.equal(spy.mock.callCount(), 0);
    const created = await createEventSubscription("access", { type: "EVENT_KEYWORD", keyword: " 간호 연구 " });
    assert.equal(created.type, "EVENT_KEYWORD");
    assert.equal(spy.mock.callCount(), 1);
});

test("device registration and removal affect only the submitted browser token", async () => {
    const methods: string[] = [];
    mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        assert.equal(new URL(input).pathname, "/api/v1/users/device/browser%3Aabc_123-test");
        methods.push(init.method!);
        return new Response(null, { status: 204 });
    });
    await updatePushToken("access", { token: "browser:abc_123-test" }, "PATCH");
    await updatePushToken("access", { token: "browser:abc_123-test" }, "DELETE");
    assert.deepEqual(methods, ["PATCH", "DELETE"]);
    for (const token of ["null", " ", "abc/../../users", "x".repeat(513)]) await assert.rejects(updatePushToken("access", { token }, "PATCH"), AuthError);
});

test("upstream failures cannot become a successful read-all response", async () => {
    mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    await assert.rejects(readAllNotifications("access"), (error: unknown) => error instanceof AuthError && error.status === 502);
});
