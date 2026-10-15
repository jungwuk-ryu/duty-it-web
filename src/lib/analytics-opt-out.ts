import { firebaseConfig } from "./firebase/config";

export const ANALYTICS_OPT_OUT_KEY = "duit-analytics-opt-out:v1";
export const ANALYTICS_OPT_OUT_EVENT = "duit-analytics-opt-out-change";
const GA_DISABLE_FLAG = `ga-disable-${firebaseConfig.measurementId}`;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

// Keeps the choice for this page view even when storage writes are blocked.
let pageChoice: boolean | null = null;

function browserStorage(): Storage | undefined {
    try { return window.localStorage; } catch { return undefined; }
}

export function readAnalyticsOptOut(storage: Storage | undefined): boolean {
    try { return storage?.getItem(ANALYTICS_OPT_OUT_KEY) === "true"; } catch { return false; }
}

export function writeAnalyticsOptOut(storage: Storage | undefined, optedOut: boolean) {
    try {
        if (optedOut) storage?.setItem(ANALYTICS_OPT_OUT_KEY, "true");
        else storage?.removeItem(ANALYTICS_OPT_OUT_KEY);
    } catch { /* Private browsing keeps the choice for the current page only. */ }
}

export function isAnalyticsOptedOut(): boolean {
    if (typeof window === "undefined") return false;
    return pageChoice ?? readAnalyticsOptOut(browserStorage());
}

// gtag checks this flag before every hit, so it also covers an SDK that is still loading.
export function applyAnalyticsDisableFlag(optedOut: boolean) {
    (window as unknown as Record<string, unknown>)[GA_DISABLE_FLAG] = optedOut;
}

export function setAnalyticsOptOut(optedOut: boolean) {
    pageChoice = optedOut;
    writeAnalyticsOptOut(browserStorage(), optedOut);
    applyAnalyticsDisableFlag(optedOut);
    window.dispatchEvent(new Event(ANALYTICS_OPT_OUT_EVENT));
}

export function subscribeAnalyticsOptOut(listener: () => void) {
    const storage = (event: StorageEvent) => {
        if (event.key !== ANALYTICS_OPT_OUT_KEY && event.key !== null) return;
        pageChoice = null; // Another tab changed the stored choice.
        listener();
    };
    window.addEventListener(ANALYTICS_OPT_OUT_EVENT, listener);
    window.addEventListener("storage", storage);
    return () => {
        window.removeEventListener(ANALYTICS_OPT_OUT_EVENT, listener);
        window.removeEventListener("storage", storage);
    };
}
