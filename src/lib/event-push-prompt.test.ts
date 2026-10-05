import assert from "node:assert/strict";
import { test } from "node:test";
import { isEventPushPage, newEventSubscriptionInputs, parseEventPushPromptRecord } from "./event-push-prompt.ts";
import { SubscriptionEventTypeSchema, type Subscription } from "./notifications.ts";

const createdAt = "2026-10-05T10:00:00";
test("first event opt-in creates all types without treating existing job subscriptions as event preferences", () => {
    const jobs: Subscription[] = [{ id: 4, createdAt, type: "JOB_KEYWORD", keyword: "간호사" }];
    const inputs = newEventSubscriptionInputs(jobs);
    assert.equal(inputs.length, SubscriptionEventTypeSchema.options.length);
    assert.ok(inputs.every((item) => item.type === "EVENT_TYPE"));
    assert.equal(jobs.length, 1);
});
test("existing keyword, host, or type choices are preserved by the desktop opt-in", () => {
    const subscriptions: Subscription[] = [
        { id: 1, createdAt, type: "EVENT_TYPE", eventType: "VOLUNTEER" },
        { id: 2, createdAt, type: "EVENT_KEYWORD", keyword: "연구" },
        { id: 3, createdAt, type: "EVENT_HOST", host: { id: 6, name: "간호협회" } },
    ];
    for (const subscription of subscriptions) assert.deepEqual(newEventSubscriptionInputs([subscription]), []);
});
test("retrying a partial all-type opt-in creates only missing subscriptions", () => {
    const subscriptions: Subscription[] = [{ id: 1, createdAt, type: "EVENT_TYPE", eventType: "VOLUNTEER" }];
    const remaining = newEventSubscriptionInputs(subscriptions, true);
    assert.equal(remaining.length, SubscriptionEventTypeSchema.options.length - 1);
    assert.ok(remaining.every((item) => item.type === "EVENT_TYPE" && item.eventType !== "VOLUNTEER"));
    const complete: Subscription[] = SubscriptionEventTypeSchema.options.map((eventType, index) => ({ id: index + 1, createdAt, type: "EVENT_TYPE", eventType }));
    assert.deepEqual(newEventSubscriptionInputs(complete, true), []);
});
test("reminder preferences reject malformed account IDs and preserve the seven-day snooze", () => {
    const record = { version: 1, dismissedUntil: Date.now() + 604_800_000, pendingAllUserId: 7, pendingSetupUserId: 7 };
    assert.deepEqual(parseEventPushPromptRecord(JSON.stringify(record)), record);
    for (const value of ["bad JSON", JSON.stringify({ ...record, version: 2 }), JSON.stringify({ ...record, pendingAllUserId: -1 })]) {
        assert.equal(parseEventPushPromptRecord(value).pendingAllUserId, null);
        assert.equal(parseEventPushPromptRecord(value).dismissedUntil, 0);
    }
    assert.ok(isEventPushPage("/events"));
    assert.ok(isEventPushPage("/events/901"));
    for (const path of ["/", "/jobs", "/notifications", "/events/new", "/events/901/edit"]) assert.equal(isEventPushPage(path), false);
});
