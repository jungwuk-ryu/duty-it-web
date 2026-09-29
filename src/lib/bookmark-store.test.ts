import assert from "node:assert/strict";
import { test } from "node:test";
import { createBookmarkStore } from "./bookmark-store.ts";

function memoryStorage() {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => { resolve = done; });
    return { promise, resolve };
}

const changed = () => {};

test("restores the account's bookmarks without marking background reads pending", async () => {
    const storage = memoryStorage();
    const first = createBookmarkStore({ userId: 7, storage, changed, request: async () => ({ isBookmarked: true }) });
    await first.load("events", 1);
    const read = deferred<unknown>();
    const restored = createBookmarkStore({ userId: 7, storage, changed, request: () => read.promise });
    assert.deepEqual(restored.getSnapshot()["events:1"], { saved: true, pending: false, error: null });
    assert.deepEqual(restored.getServerSnapshot(), {});
    const loading = restored.load("events", 1);
    assert.equal(restored.getSnapshot()["events:1"].pending, false);
    assert.equal(restored.getSnapshot()["events:1"].saved, true);
    read.resolve({ isBookmarked: false });
    await loading;
    assert.equal(restored.getSnapshot()["events:1"].saved, false);
});

test("does not restore a different account's bookmarks or fetch as a guest", async () => {
    const storage = memoryStorage();
    await createBookmarkStore({ userId: 7, storage, changed, request: async () => ({ isBookmarked: true }) }).load("jobs", 1);
    for (const userId of [8, undefined]) {
        const store = createBookmarkStore({ userId, storage, changed, request: async () => { assert.fail("Guest request"); } });
        assert.deepEqual(store.getSnapshot(), {});
        if (!userId) { await store.load("jobs", 1); await store.toggle("jobs", 1); }
    }
});

test("a click during the initial read waits then toggles once, blocking duplicate clicks", async () => {
    const read = deferred<unknown>();
    let gets = 0;
    let posts = 0;
    const store = createBookmarkStore({ userId: 7, changed, request: async (_kind, _id, toggle) => {
        if (toggle) { posts++; return { isBookmarked: true }; }
        gets++; return read.promise;
    } });
    const loading = store.load("events", 1);
    const click = store.toggle("events", 1);
    await store.toggle("events", 1);
    assert.equal(store.getSnapshot()["events:1"].pending, true);
    assert.equal(posts, 0);
    read.resolve({ isBookmarked: false });
    await Promise.all([loading, click]);
    assert.equal(gets, 1);
    assert.equal(posts, 1);
    assert.deepEqual(store.getSnapshot()["events:1"], { saved: true, pending: false, error: null });
});

test("a click before any read completes its intended toggle without a second click", async () => {
    const calls: boolean[] = [];
    const store = createBookmarkStore({ userId: 7, changed, request: async (_kind, _id, toggle) => {
        calls.push(toggle); return { isBookmarked: toggle };
    } });
    await store.toggle("jobs", 2);
    assert.deepEqual(calls, [false, true]);
    assert.equal(store.getSnapshot()["jobs:2"].saved, true);
});

test("a failed read preserves the cached state and does not send a toggle", async () => {
    const storage = memoryStorage();
    await createBookmarkStore({ userId: 7, storage, changed, request: async () => ({ isBookmarked: true }) }).load("events", 1);
    let posts = 0;
    const store = createBookmarkStore({ userId: 7, storage, changed, request: async (_kind, _id, toggle) => {
        if (toggle) posts++;
        throw new Error("offline");
    } });
    await store.load("events", 1);
    await store.toggle("events", 1);
    assert.equal(posts, 0);
    assert.equal(store.getSnapshot()["events:1"].saved, true);
    assert.equal(store.getSnapshot()["events:1"].pending, false);
    assert.ok(store.getSnapshot()["events:1"].error);
});

test("lost toggle responses are reconciled rather than replayed on the next click", async () => {
    let saved = false;
    let posts = 0;
    const store = createBookmarkStore({ userId: 7, changed, request: async (_kind, _id, toggle) => {
        if (toggle) { posts++; saved = !saved; throw new Error("lost response"); }
        return { isBookmarked: saved };
    } });
    await store.load("events", 1);
    await store.toggle("events", 1);
    assert.ok(store.getSnapshot()["events:1"].error);
    await store.toggle("events", 1);
    assert.equal(posts, 1);
    assert.deepEqual(store.getSnapshot()["events:1"], { saved: true, pending: false, error: null });
});

test("ignores corrupt and expired persisted data, and works when storage is blocked", async () => {
    const storage = memoryStorage();
    for (const raw of ["broken", JSON.stringify({ version: 1, entries: { "events:1": { saved: "yes", at: Date.now() }, "jobs:2": { saved: true, at: 1 }, "events:3": null } })]) {
        storage.setItem("duit-bookmarks:v1:7", raw);
        const store = createBookmarkStore({ userId: 7, storage, changed, request: async () => ({ isBookmarked: false }) });
        assert.deepEqual(store.getSnapshot(), {});
    }
    const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    const store = createBookmarkStore({ userId: 7, storage: blocked, changed, request: async () => ({ isBookmarked: true }) });
    await store.load("jobs", 1);
    assert.equal(store.getSnapshot()["jobs:1"].saved, true);
});

test("background rechecks cannot overwrite an in-flight toggle", async () => {
    const post = deferred<unknown>();
    let gets = 0;
    const store = createBookmarkStore({ userId: 7, changed, request: async (_kind, _id, toggle) => {
        if (toggle) return post.promise;
        gets++; return { isBookmarked: false };
    } });
    await store.load("jobs", 1);
    const click = store.toggle("jobs", 1);
    store.recheck();
    post.resolve({ isBookmarked: true });
    await click;
    assert.equal(gets, 1);
    assert.equal(store.getSnapshot()["jobs:1"].saved, true);
});
