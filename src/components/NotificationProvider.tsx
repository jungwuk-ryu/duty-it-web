"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { responseJson, sessionFetch, useAuth } from "@/src/lib/auth/client";
import { NotificationsPageSchema } from "@/src/lib/notifications";
import { NOTIFICATIONS_CHANGE_EVENT, PUSH_CHANGE_EVENT, PUSH_STORAGE_KEY, notificationHrefFromData, parseBrowserPushRecord } from "@/src/lib/web-push";
import { Button } from "./ui/button";
import { cn } from "@/src/lib/utils";

const CHANGE_STORAGE_KEY = "duit-notification-change";
const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });
export function useNotifications() { return useContext(NotificationContext); }

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const userId = auth.user?.id ?? null;
    const [count, setCount] = useState({ userId: null as number | null, value: 0 });
    const [notice, setNotice] = useState<{ userId: number; title: string; body: string; href: string } | null>(null);
    const refresh = useCallback(() => {
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
        try { localStorage.setItem(CHANGE_STORAGE_KEY, crypto.randomUUID()); } catch { /* Same-tab updates still work. */ }
    }, []);

    useEffect(() => {
        if (auth.status === "error" && !userId) return;
        let canceled = false;
        let pushEpoch = 0;
        let stopMessages: (() => void) | undefined;
        let controller: AbortController | undefined;
        let noticeTimer: ReturnType<typeof setTimeout> | undefined;
        let lastCheck = 0;

        async function loadCount(force = false) {
            if (!userId || document.visibilityState !== "visible") return;
            if (!force && Date.now() - lastCheck < 15_000) return;
            lastCheck = Date.now();
            controller?.abort();
            const current = new AbortController();
            controller = current;
            try {
                const page = NotificationsPageSchema.parse(await responseJson(await sessionFetch("/api/notifications?unread=true&size=1", { signal: current.signal })));
                if (!canceled && !current.signal.aborted) setCount({ userId, value: page.totalElements });
            } catch { /* Preserve the last confirmed count on transient errors. */ }
        }
        async function attachPush() {
            const epoch = ++pushEpoch;
            stopMessages?.();
            stopMessages = undefined;
            let record;
            try { record = parseBrowserPushRecord(localStorage.getItem(PUSH_STORAGE_KEY)); } catch { return; }
            if (!record) return;
            try {
                const push = await import("@/src/lib/notifications/push");
                const status = await push.synchronizeBrowserPush(userId);
                if (canceled || epoch !== pushEpoch || !userId || status !== "enabled") return;
                const stop = await push.observeForegroundPush((message) => {
                    if (canceled || epoch !== pushEpoch) return;
                    setNotice({ userId, title: message.title, body: message.body, href: notificationHrefFromData(message.data) });
                    clearTimeout(noticeTimer);
                    noticeTimer = setTimeout(() => setNotice(null), 8_000);
                    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGE_EVENT, { detail: { incoming: true } }));
                });
                if (canceled || epoch !== pushEpoch) stop();
                else stopMessages = stop;
            } catch { /* Settings surface provides an actionable retry. */ }
        }
        const changed = () => void loadCount(true);
        const resume = () => void loadCount();
        const storage = (event: StorageEvent) => {
            if (event.key === CHANGE_STORAGE_KEY) changed();
            if (event.key === PUSH_STORAGE_KEY) void attachPush();
        };
        const workerMessage = (event: MessageEvent) => {
            if (event.data?.type === "duit-notification") {
                window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGE_EVENT, { detail: { incoming: true } }));
            }
        };
        void loadCount(true);
        void attachPush();
        const timer = setInterval(resume, 60_000);
        window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, changed);
        window.addEventListener(PUSH_CHANGE_EVENT, attachPush);
        window.addEventListener("focus", resume);
        window.addEventListener("online", resume);
        window.addEventListener("storage", storage);
        document.addEventListener("visibilitychange", resume);
        navigator.serviceWorker?.addEventListener("message", workerMessage);
        return () => {
            canceled = true;
            controller?.abort();
            stopMessages?.();
            clearTimeout(noticeTimer);
            clearInterval(timer);
            window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, changed);
            window.removeEventListener(PUSH_CHANGE_EVENT, attachPush);
            window.removeEventListener("focus", resume);
            window.removeEventListener("online", resume);
            window.removeEventListener("storage", storage);
            document.removeEventListener("visibilitychange", resume);
            navigator.serviceWorker?.removeEventListener("message", workerMessage);
        };
    }, [userId, auth.status]);

    const unreadCount = count.userId === userId && userId ? count.value : 0;
    const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);
    const visibleNotice = notice?.userId === userId ? notice : null;
    return <NotificationContext.Provider value={value}>
        {children}
        {visibleNotice && <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-24 z-[110] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl">
            <Bell className="mt-1 shrink-0 text-brand" size={20} aria-hidden />
            <Link href={visibleNotice.href} onClick={() => setNotice(null)} className="min-w-0 flex-1 rounded focus-visible:outline-2 focus-visible:outline-brand">
                <strong className="block text-sm">{visibleNotice.title}</strong>
                <span className="mt-1 block break-words text-sm leading-6 text-muted-foreground">{visibleNotice.body}</span>
            </Link>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="새 알림 안내 닫기" onClick={() => setNotice(null)}><X size={16} aria-hidden /></Button>
        </div>}
    </NotificationContext.Provider>;
}

export function NotificationLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
    const { unreadCount } = useNotifications();
    return <Link href="/notifications" onClick={onNavigate}
        aria-label={unreadCount ? "알림, 안 읽은 알림 " + unreadCount + "개" : "알림"}
        className={cn("relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand", className)}>
        <Bell size={20} aria-hidden />
        {unreadCount > 0 && <span aria-hidden className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>;
}
