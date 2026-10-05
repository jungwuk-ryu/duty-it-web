import assert from "node:assert/strict";
import { test } from "node:test";
import { disconnectPush, notificationHrefFromData, parseBrowserPushRecord } from "./web-push.ts";
import { formatNotificationDate } from "./notifications.ts";

test("failed API cleanup still revokes browser delivery before logout", async () => {
    let revoked = false;
    await disconnectPush({
        remote: async () => { throw new Error("Session expired"); },
        local: async () => { revoked = true; return true; },
    });
    assert.equal(revoked, true);
});
test("successful server unregister is sufficient if the browser SDK is unavailable", async () => {
    await disconnectPush({ remote: async () => {}, local: async () => { throw new Error("SDK unavailable"); } });
});
test("both failed cleanup paths keep the failure visible", async () => {
    await assert.rejects(disconnectPush({
        remote: async () => { throw new Error("Offline"); }, local: async () => false,
    }), /브라우저 알림을 끄지 못했어요/);
});
test("stored push registrations bind the token to a validated account and schema version", () => {
    const record = { version: 1, userId: 7, token: "browser:token_1" };
    assert.deepEqual(parseBrowserPushRecord(JSON.stringify(record)), record);
    for (const value of ["bad JSON", JSON.stringify({ ...record, userId: -1 }), JSON.stringify({ ...record, version: 2 }), JSON.stringify({ ...record, token: "null" })]) {
        assert.equal(parseBrowserPushRecord(value), null);
    }
});
test("push click destinations use safe local IDs rather than arbitrary supplied URLs", () => {
    assert.equal(notificationHrefFromData({ eventId: "14" }), "/events/14");
    assert.equal(notificationHrefFromData({ jobPostingId: "27" }), "/jobs/27");
    for (const eventId of ["-1", "0", "1/../../login", "//evil.test", "9007199254740992", "1e2"]) {
        assert.equal(notificationHrefFromData({ eventId, link: "https://evil.test" }), "/notifications");
    }
    assert.equal(notificationHrefFromData(undefined), "/notifications");
});
test("notification timestamps without offsets are interpreted as Korean time", () => {
    assert.equal(formatNotificationDate("2026-10-05T09:00:00"), formatNotificationDate("2026-10-05T00:00:00Z"));
    assert.equal(formatNotificationDate("invalid"), "");
});
