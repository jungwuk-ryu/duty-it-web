"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { PublicUser } from "./session-crypto";

type AuthState = { status: "loading" | "authenticated" | "guest" | "error"; user: PublicUser | null; message: string | null };
const INITIAL: AuthState = { status: "loading", user: null, message: null };
let state = INITIAL;
let generation = 0;
const listeners = new Set<() => void>();
let refreshing: Promise<Response> | null = null;
let checking: Promise<void> | null = null;
let queue: Promise<unknown> = Promise.resolve();
const UserResponseSchema = z.object({ user: z.object({ id: z.number().int().positive(), nickname: z.string() }) });

export class SessionRequestError extends Error {
    constructor(message: string, readonly status: number) { super(message); this.name = "SessionRequestError"; }
}

function publish(next: AuthState) { state = next; listeners.forEach((listener) => listener()); }
export function useAuth() {
    return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => state, () => INITIAL);
}
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
            if (current.status !== 401) return current;
            return request("/api/auth/refresh", { method: "POST" });
        }).finally(() => { refreshing = null; });
    }
    return (await refreshing).clone();
}

export async function sessionFetch(path: string, init?: RequestInit): Promise<Response> {
    if (!path.startsWith("/api/")) throw new Error("Session requests must stay on this site.");
    const started = generation;
    const response = await request(path, init);
    if (response.status !== 401) return response;
    const refreshed = await refreshSession();
    if (started !== generation) throw new SessionRequestError("로그인 상태가 변경되었습니다. 다시 시도해 주세요.", 409);
    if (!refreshed.ok) {
        if (refreshed.status === 401) publish({ status: "guest", user: null, message: null });
        return refreshed;
    }
    const parsed = UserResponseSchema.safeParse(await refreshed.json());
    if (!parsed.success) throw new SessionRequestError("로그인을 확인하지 못했습니다.", 502);
    publish({ status: "authenticated", user: parsed.data.user, message: null });
    // Only a definite 401 is retried. Never replay a toggle after a timeout or 5xx.
    return request(path, init);
}

export async function responseJson(response: Response): Promise<unknown> {
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const error = z.object({ message: z.string() }).safeParse(body);
        throw new SessionRequestError(error.success ? error.data.message : "요청을 처리하지 못했습니다. 다시 시도해 주세요.", response.status);
    }
    return body;
}

export function checkSession(): Promise<void> {
    if (checking) return checking;
    const started = generation;
    checking = (async () => {
        try {
            const response = await sessionFetch("/api/auth/session");
            if (started !== generation) return;
            if (response.status === 401) { publish({ status: "guest", user: null, message: null }); return; }
            const parsed = UserResponseSchema.parse(await responseJson(response));
            if (started === generation) publish({ status: "authenticated", user: parsed.user, message: null });
        } catch {
            if (started === generation) publish({ ...state, status: state.user ? "authenticated" : "error", message: "로그인 연결을 확인하지 못했습니다. 다시 시도해 주세요." });
        }
    })().finally(() => { checking = null; });
    return checking;
}

export async function signInSession(refreshToken: string) {
    return withAuthLock(async () => {
        const response = await request("/api/auth/social", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
        });
        const parsed = UserResponseSchema.extend({ isNewUser: z.boolean() }).parse(await responseJson(response));
        generation++;
        publish({ status: "authenticated", user: parsed.user, message: null });
        signalChange();
        return parsed;
    });
}

export async function signOutSession() {
    return withAuthLock(async () => {
        await responseJson(await request("/api/auth/logout", { method: "POST" }));
        generation++;
        publish({ status: "guest", user: null, message: null });
        signalChange();
    });
}

export function observeSession() {
    void checkSession();
    const resume = () => { if (document.visibilityState === "visible") void checkSession(); };
    const changed = (event: StorageEvent) => {
        if (event.key !== "duit-auth-change") return;
        generation++;
        publish(INITIAL); // Remove the previous account's private content immediately.
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
