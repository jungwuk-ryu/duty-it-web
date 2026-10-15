import assert from "node:assert/strict";
import { test } from "node:test";
import { ANALYTICS_OPT_OUT_KEY, readAnalyticsOptOut, writeAnalyticsOptOut } from "./analytics-opt-out.ts";

function memoryStorage() {
    const values = new Map<string, string>();
    return {
        values,
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
    };
}

test("stores the analytics opt-out under a versioned key and clears it on opt-in", () => {
    const storage = memoryStorage();
    assert.equal(readAnalyticsOptOut(storage), false);
    writeAnalyticsOptOut(storage, true);
    assert.equal(storage.values.get(ANALYTICS_OPT_OUT_KEY), "true");
    assert.equal(readAnalyticsOptOut(storage), true);
    writeAnalyticsOptOut(storage, false);
    assert.equal(storage.values.has(ANALYTICS_OPT_OUT_KEY), false);
    assert.equal(readAnalyticsOptOut(storage), false);
});

test("blocked or unknown storage values never break the page", () => {
    const blocked = {
        getItem: () => { throw new Error("SecurityError"); },
        setItem: () => { throw new Error("QuotaExceededError"); },
        removeItem: () => { throw new Error("SecurityError"); },
    };
    assert.equal(readAnalyticsOptOut(blocked), false);
    assert.doesNotThrow(() => writeAnalyticsOptOut(blocked, true));
    assert.equal(readAnalyticsOptOut(undefined), false);
    const storage = memoryStorage();
    storage.setItem(ANALYTICS_OPT_OUT_KEY, "yes");
    assert.equal(readAnalyticsOptOut(storage), false);
});
