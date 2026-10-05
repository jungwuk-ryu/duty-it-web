import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { firebaseMessagingWorker } from "./firebase-messaging-worker.ts";

function worker() {
    const handlers = new Map<string, (event: unknown) => void>();
    const opened: string[] = [];
    const shown: unknown[] = [];
    const posted: unknown[] = [];
    let background: (payload: unknown) => Promise<void>;
    runInNewContext(firebaseMessagingWorker({ projectId: "test" }, "12.18.0"), {
        URL, console,
        self: {
            location: { origin: "https://www.dutyit.net" }, skipWaiting() {},
            addEventListener(type: string, handler: (event: unknown) => void) { handlers.set(type, handler); },
            clients: { claim() {}, async matchAll() { return [{ url: "https://www.dutyit.net/notifications", postMessage(value: unknown) { posted.push(value); } }]; },
                async openWindow(url: string) { opened.push(url); } },
            registration: { async showNotification(title: string, options: unknown) { shown.push({ title, options }); } },
        },
        importScripts() {},
        firebase: { initializeApp() {}, messaging() { return { onBackgroundMessage(handler: typeof background) { background = handler; } }; } },
    });
    async function click(data: unknown) {
        let pending: Promise<unknown> = Promise.resolve();
        handlers.get("notificationclick")!({
            stopImmediatePropagation() {}, notification: { data, close() {} },
            waitUntil(work: Promise<unknown>) { pending = work; },
        });
        await pending;
    }
    return { opened, shown, posted, click, background: (payload: unknown) => background!(payload) };
}
test("worker handles FCM notification click payloads and rejects external destinations", async () => {
    const scope = worker();
    await scope.click({ FCM_MSG: { data: { eventId: "41" } } });
    await scope.click({ FCM_MSG: { data: { eventId: "https://evil.test" }, fcmOptions: { link: "https://evil.test" } } });
    assert.deepEqual(scope.opened, ["https://www.dutyit.net/events/41", "https://www.dutyit.net/notifications"]);
});
test("notification payloads do not display twice and data payloads can display once", async () => {
    const scope = worker();
    await scope.background({ notification: { title: "새 행사" }, data: { eventId: "41" } });
    assert.equal(scope.shown.length, 0);
    assert.equal(scope.posted.length, 1);
    await scope.background({ data: { eventId: "41" } });
    assert.equal(scope.shown.length, 1);
});
