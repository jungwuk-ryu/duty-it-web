import "client-only";
import { getCurrentUserId, responseJson, sessionFetch } from "../auth/client";
import { firebaseConfig, firebaseWebPushVapidKey } from "../firebase/config";
import {
    BrowserPushRecord, PUSH_CHANGE_EVENT, PUSH_STORAGE_KEY, disconnectPush, parseBrowserPushRecord,
} from "../web-push";

const vapidKey = firebaseWebPushVapidKey;
export type BrowserPushStatus = "ready" | "enabled" | "denied" | "install" | "unsupported" | "unconfigured";
let queue: Promise<unknown> = Promise.resolve();
async function withPushLock<T>(work: () => Promise<T>): Promise<T> {
    if (navigator.locks) return await navigator.locks.request("duit-web-push", work);
    const next = queue.then(work, work);
    queue = next.catch(() => undefined);
    return next;
}
export function readBrowserPushRecord() {
    try { return parseBrowserPushRecord(localStorage.getItem(PUSH_STORAGE_KEY)); }
    catch { return null; }
}
function saveRecord(record: BrowserPushRecord | null) {
    const previous = readBrowserPushRecord();
    if (record && previous?.userId === record.userId && previous.token === record.token) return;
    if (record) localStorage.setItem(PUSH_STORAGE_KEY, JSON.stringify(record));
    else localStorage.removeItem(PUSH_STORAGE_KEY);
    window.dispatchEvent(new Event(PUSH_CHANGE_EVENT));
}
function requireOwner(userId: number) {
    if (getCurrentUserId() !== userId) throw new Error("로그인 상태가 변경되었어요. 다시 확인해 주세요.");
}
export function browserPushAvailability(): BrowserPushStatus {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
        || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (ios && !standalone) return "install";
    if (!window.isSecureContext || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
    if (Notification.permission === "denied") return "denied";
    return vapidKey ? "ready" : "unconfigured";
}
async function messagingClient() {
    const [appSdk, sdk] = await Promise.all([import("firebase/app"), import("firebase/messaging")]);
    if (!await sdk.isSupported()) throw new Error("이 브라우저에서는 푸시 알림을 지원하지 않아요.");
    const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
    return { sdk, messaging: sdk.getMessaging(app) };
}
async function localRevoke(): Promise<boolean> {
    let firebaseRevoked = false;
    try {
        const { sdk, messaging } = await messagingClient();
        firebaseRevoked = await sdk.deleteToken(messaging);
    } catch { /* The Push API can still revoke a subscription if Firebase is unavailable. */ }
    try {
        // A newly loaded Firebase instance may use its default worker scope.
        // Always revoke the root subscription that this web app registered.
        const registration = await navigator.serviceWorker?.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        return subscription ? await subscription.unsubscribe() || firebaseRevoked : true;
    } catch (error) {
        if (firebaseRevoked) return true;
        throw error;
    }
}
async function revokeRecord(record: BrowserPushRecord, removeRemote = true) {
    await disconnectPush({
        remote: async () => {
            if (!removeRemote || getCurrentUserId() !== record.userId) throw new Error("Account changed");
            await responseJson(await sessionFetch("/api/notifications/device", {
                method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: record.token }),
            }));
        },
        local: localRevoke,
    });
    saveRecord(null);
}
async function registerToken(userId: number) {
    requireOwner(userId);
    const { sdk, messaging } = await messagingClient();
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/", updateViaCache: "none" });
    let activationTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, reject) => {
                activationTimeout = setTimeout(() => reject(new Error("알림 연결이 지연되고 있어요. 연결을 확인하고 다시 시도해 주세요.")), 20_000);
            }),
        ]);
    } finally {
        clearTimeout(activationTimeout);
    }
    requireOwner(userId);
    const token = await sdk.getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) throw new Error("브라우저 알림을 등록하지 못했어요. 다시 시도해 주세요.");
    try {
        requireOwner(userId);
        await responseJson(await sessionFetch("/api/notifications/device", {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
        }));
        requireOwner(userId);
        saveRecord({ version: 1, userId, token });
    } catch (error) {
        await revokeRecord({ version: 1, userId, token }).catch(() => undefined);
        throw error;
    }
}
export async function enableBrowserPush(userId: number): Promise<BrowserPushStatus> {
    const availability = browserPushAvailability();
    if (availability !== "ready") return availability;
    // Request immediately from the click, before imports/locks lose the iOS user gesture.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return permission === "denied" ? "denied" : "ready";
    return withPushLock<BrowserPushStatus>(async () => {
        requireOwner(userId);
        const previous = readBrowserPushRecord();
        if (previous && previous.userId !== userId) await revokeRecord(previous, false);
        await registerToken(userId);
        return "enabled";
    });
}
export async function disableBrowserPush() {
    return withPushLock(async () => {
        const record = readBrowserPushRecord();
        if (record) await revokeRecord(record);
    });
}
export async function preparePushLogout() {
    if (readBrowserPushRecord()) await disableBrowserPush();
}
let synchronization: { userId: number | null; promise: Promise<BrowserPushStatus> } | null = null;
export function synchronizeBrowserPush(userId: number | null): Promise<BrowserPushStatus> {
    if (synchronization?.userId === userId) return synchronization.promise;
    const promise = withPushLock<BrowserPushStatus>(async () => {
        const record = readBrowserPushRecord();
        if (record && (record.userId !== userId || !("Notification" in window) || Notification.permission !== "granted")) {
            await revokeRecord(record, record.userId === userId);
            return browserPushAvailability();
        }
        const availability = browserPushAvailability();
        if (record && userId && availability === "ready") {
            await registerToken(userId);
            return "enabled";
        }
        if (record && userId && availability === "unconfigured") return "enabled";
        return availability;
    }).finally(() => {
        if (synchronization?.promise === promise) synchronization = null;
    });
    synchronization = { userId, promise };
    return promise;
}
export async function observeForegroundPush(handler: (message: { title: string; body: string; data?: Record<string, string> }) => void) {
    const { sdk, messaging } = await messagingClient();
    return sdk.onMessage(messaging, (payload) => {
        const record = readBrowserPushRecord();
        if (!record || record.userId !== getCurrentUserId()) return;
        handler({
            title: payload.notification?.title ?? "새 소식이 도착했어요",
            body: payload.notification?.body ?? "", data: payload.data,
        });
    });
}
