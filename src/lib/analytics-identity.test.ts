import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyticsIdentitySync } from "./analytics-identity.ts";

function runtime(calls: Array<[string, string | null]>) {
    return {
        initialize: (id: string | null) => { calls.push(["initialize", id]); },
        setUserId: (id: string | null) => { calls.push(["set", id]); },
    };
}

test("initializes a restored session with the shared backend member ID", async () => {
    const calls: Array<[string, string | null]> = [];
    const sync = createAnalyticsIdentitySync(async () => runtime(calls));
    await sync(42);
    assert.deepEqual(calls, [["initialize", "42"]]);
});

test("updates login and account switches, clears logout, and ignores unchanged IDs", async () => {
    const calls: Array<[string, string | null]> = [];
    const sync = createAnalyticsIdentitySync(async () => runtime(calls));
    for (const id of [null, 42, 42, 84, null, null]) await sync(id);
    assert.deepEqual(calls, [["initialize", null], ["set", "42"], ["set", "84"], ["set", null]]);
});

test("a delayed SDK uses the newest account, even with concurrent session changes", async () => {
    const calls: Array<[string, string | null]> = [];
    let resolve!: (value: ReturnType<typeof runtime>) => void;
    const sync = createAnalyticsIdentitySync(() => new Promise((done) => { resolve = done; }));
    const initial = sync(42);
    const switched = sync(84);
    resolve(runtime(calls));
    await Promise.all([initial, switched]);
    assert.deepEqual(calls, [["initialize", "84"]]);
});

test("logout while the SDK loads cannot restore the previous identity", async () => {
    const calls: Array<[string, string | null]> = [];
    let resolve!: (value: ReturnType<typeof runtime>) => void;
    const sync = createAnalyticsIdentitySync(() => new Promise((done) => { resolve = done; }));
    const initial = sync(42);
    const logout = sync(null);
    resolve(runtime(calls));
    await Promise.all([initial, logout]);
    assert.deepEqual(calls, [["initialize", null]]);
});

test("can retry initialization after an SDK load failure", async () => {
    const calls: Array<[string, string | null]> = [];
    let attempts = 0;
    const sync = createAnalyticsIdentitySync(async () => {
        if (++attempts === 1) throw new Error("SDK unavailable");
        return runtime(calls);
    });
    await assert.rejects(sync(42), /SDK unavailable/);
    await sync(84);
    assert.deepEqual(calls, [["initialize", "84"]]);
});

test("unsupported browsers remain a no-op across authentication changes", async () => {
    let attempts = 0;
    const sync = createAnalyticsIdentitySync(async () => { attempts++; return null; });
    await sync(null);
    await sync(42);
    await sync(null);
    assert.equal(attempts, 1);
});
