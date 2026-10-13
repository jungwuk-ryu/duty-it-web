"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { GUEST, type AuthState } from "./state";
import type { PublicUser } from "./session-crypto";

export const InitialAuthContext = createContext<AuthState>(GUEST);
let state: AuthState | null = null;
let generation = 0;
const listeners = new Set<() => void>();
let refreshing: Promise<Response> | null = null;
let checking: Promise<void> | null = null;
let queue: Promise<unknown> = Promise.resolve();
// Plain checks instead of zod: this module loads on every page.
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
/** The response's user, `null` for the guest answer of the session check, or `undefined` when malformed. */
function responseUser(body: unknown): PublicUser | null | undefined {
    if (!isRecord(body)) return undefined;
    const { user } = body;
    if (user === null) return null;
    if (!isRecord(user) || !Number.isInteger(user.id) || (user.id as number) <= 0 || typeof user.nickname !== "string") return undefined;
    return { id: user.id as number, nickname: user.nickname };
}

export class SessionRequestError extends Error {
    constructor(message: string, readonly status: number) { super(message); this.name = "SessionRequestError"; }
}

function publish(next: AuthState) { state = next; listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useAuth() {
    const initial = useContext(InitialAuthContext);
    return useSyncExternalStore(subscribe, () => state ?? initial, () => initial);
}
export function getCurrentUserId() { return state?.user?.id ?? null; }
function signalChange() {
    window.dispatchEvent(new Event("duit-auth-change"));
    try { localStorage.setItem("duit-auth-change", crypto.randomUUID()); } catch { /* Cookies work without localStorage. */ }
}

// Serialize cookie writes, including logout, across tabs where Web Locks is available.
async function withAuthLock<T>(work: () => Promise<T>): Promise<T> {
    if (navigator.locks) return await navigator.locks.request("duit-auth-session", work);
    const next = queue.then(work, work);
    queue = next.catch(() => undefined);
    return next;
}

function request(path: string, init?: RequestInit) {
    return fetch(path, { ...init, credentials: "same-origin", cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(40_000) });
}

async function refreshSession() {
    if (!refreshing) {
        refreshing = withAuthLock(async () => {
            // Another tab may already have refreshed or logged out while waiting for the lock.
            const current = await request("/api/auth/session");
            // A guest answer means the cookie is gone; the refresh endpoint reports that as 401.
            if (current.status !== 401 && !await isGuestResponse(current)) return current;
            return request("/api/auth/refresh", { method: "POST" });
        }).finally(() => { refreshing = null; });
    }
    return (await refreshing).clone();
}

async function isGuestResponse(response: Response) {
    if (!response.ok) return false;
    return responseUser(await response.clone().json().catch(() => null)) === null;
}

export async function sessionFetch(path: string, init?: RequestInit): Promise<Response> {
    if (!path.startsWith("/api/")) throw new Error("Session requests must stay on this site.");
    const started = generation;
    const response = await request(path, init);
    if (started !== generation) throw new SessionRequestError("로그인 상태가 변경되었습니다. 다시 시도해 주세요.", 409);
    if (response.status !== 401) return response;
    const refreshed = await refreshSession();
    if (started !== generation) throw new SessionRequestError("로그인 상태가 변경되었습니다. 다시 시도해 주세요.", 409);
    if (!refreshed.ok) {
        if (refreshed.status === 401) publish({ status: "guest", user: null, message: null });
        return refreshed;
    }
    const user = responseUser(await refreshed.json());
    if (started !== generation) throw new SessionRequestError("로그인 상태가 변경되었습니다. 다시 시도해 주세요.", 409);
    if (!user) throw new SessionRequestError("로그인을 확인하지 못했습니다.", 502);
    publish({ status: "authenticated", user, message: null });
    // Only a definite 401 is retried. Never replay a toggle after a timeout or 5xx.
    const retried = await request(path, init);
    if (started !== generation) throw new SessionRequestError("로그인 상태가 변경되었습니다. 다시 시도해 주세요.", 409);
    return retried;
}

export async function responseJson(response: Response): Promise<unknown> {
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const message = isRecord(body) && typeof body.message === "string" ? body.message : "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
        throw new SessionRequestError(message, response.status);
    }
    return body;
}

export function checkSession(): Promise<void> {
    if (checking) return checking;
    const started = generation;
    const check = (async () => {
        try {
            const response = await sessionFetch("/api/auth/session");
            if (started !== generation) return;
            if (response.status === 401) { publish({ status: "guest", user: null, message: null }); return; }
            // The session check answers guests with `user: null` instead of a 401 that would start a refresh.
            const user = responseUser(await responseJson(response));
            if (user === undefined) throw new SessionRequestError("로그인을 확인하지 못했습니다.", 502);
            if (started === generation) publish(user ? { status: "authenticated", user, message: null } : GUEST);
        } catch {
            if (started === generation) publish({ user: state?.user ?? null, status: state?.user ? "authenticated" : "error", message: "로그인 연결을 확인하지 못했습니다. 다시 시도해 주세요." });
        }
    })().finally(() => { if (checking === check) checking = null; });
    checking = check;
    return check;
}

export async function signInSession(refreshToken: string) {
    const { preparePushLogout } = await import("../notifications/push");
    await preparePushLogout();
    return withAuthLock(async () => {
        const response = await request("/api/auth/social", {
            method: "POST",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: refreshToken,
        });
        const body = await responseJson(response);
        const user = responseUser(body);
        if (!user || !isRecord(body) || typeof body.isNewUser !== "boolean") throw new SessionRequestError("로그인을 확인하지 못했습니다.", 502);
        generation++;
        publish({ status: "authenticated", user, message: null });
        signalChange();
        return { user, isNewUser: body.isNewUser };
    });
}

export async function signOutSession() {
    // Push cleanup may refresh the session, so it must run before the auth lock.
    const { preparePushLogout } = await import("../notifications/push");
    await preparePushLogout();
    return withAuthLock(async () => {
        await responseJson(await request("/api/auth/logout", { method: "POST" }));
        generation++;
        publish({ status: "guest", user: null, message: null });
        signalChange();
    });
}

export function observeSession(initial: AuthState) {
    if (!state) publish(initial);
    void checkSession();
    const resume = () => { if (document.visibilityState === "visible") void checkSession(); };
    const changed = (event: StorageEvent) => {
        if (event.key !== "duit-auth-change") return;
        generation++;
        publish(GUEST); // Remove the previous account's private content immediately.
        checking = null;
        void checkSession();
    };
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("storage", changed);
    document.addEventListener("visibilitychange", resume);
    return () => {
        window.removeEventListener("online", resume); window.removeEventListener("focus", resume);
        window.removeEventListener("storage", changed); document.removeEventListener("visibilitychange", resume);
    };
}

export function safeReturnTo(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/events";
    const url = new URL(value, "https://www.dutyit.net");
    return url.origin === "https://www.dutyit.net" && url.pathname !== "/login" ? `${url.pathname}${url.search}${url.hash}` : "/events";
}
