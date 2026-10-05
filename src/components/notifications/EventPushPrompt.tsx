"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, LoaderCircle, X } from "lucide-react";
import { getCurrentUserId, responseJson, sessionFetch, useAuth } from "@/src/lib/auth/client";
import { SubscriptionSchema, SubscriptionsSchema } from "@/src/lib/notifications";
import { browserPushAvailability, enableBrowserPush, readBrowserPushRecord } from "@/src/lib/notifications/push";
import { PUSH_CHANGE_EVENT, PUSH_STORAGE_KEY } from "@/src/lib/web-push";
import {
    EVENT_PUSH_PROMPT_DELAY, EVENT_PUSH_PROMPT_KEY, EVENT_PUSH_PROMPT_SESSION_KEY, EVENT_PUSH_PROMPT_SNOOZE,
    isEventPushPage, newEventSubscriptionInputs, parseEventPushPromptRecord, type EventPushPromptRecord,
} from "@/src/lib/event-push-prompt";
import { Button } from "../ui/button";

const LOGIN_KEY = EVENT_PUSH_PROMPT_SESSION_KEY + ":login";
let seenInMemory = false;
function readPreference() {
    try { return parseEventPushPromptRecord(localStorage.getItem(EVENT_PUSH_PROMPT_KEY)); }
    catch { return parseEventPushPromptRecord(null); }
}
function savePreference(record: EventPushPromptRecord) {
    try { localStorage.setItem(EVENT_PUSH_PROMPT_KEY, JSON.stringify(record)); } catch { /* Optional persistent reminder preference. */ }
}
function seenThisSession() {
    try { return seenInMemory || sessionStorage.getItem(EVENT_PUSH_PROMPT_SESSION_KEY) === "seen"; }
    catch { return seenInMemory; }
}
function markSeen() {
    seenInMemory = true;
    try { sessionStorage.setItem(EVENT_PUSH_PROMPT_SESSION_KEY, "seen"); } catch { /* The in-memory guard still applies. */ }
}
function returningFromLogin() {
    try {
        const started = Number(sessionStorage.getItem(LOGIN_KEY));
        return started > 0 && Date.now() - started >= 0 && Date.now() - started < 30 * 60_000;
    } catch { return false; }
}

export default function EventPushPrompt({ container }: { container: HTMLElement | null }) {
    const pathname = usePathname();
    const auth = useAuth();
    if (!isEventPushPage(pathname) || (auth.status === "error" && !auth.user)) return null;
    return <EventPushOffer key={auth.user?.id ?? "guest"} userId={auth.user?.id ?? null} container={container} />;
}

function EventPushOffer({ userId, container }: { userId: number | null; container: HTMLElement | null }) {
    const router = useRouter();
    const [view, setView] = useState<"offer" | "success" | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const busy = useRef(false);
    const mounted = useRef(false);
    const dismissed = useRef(false);
    const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        mounted.current = true;
        const desktop = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
        const showAfter = Date.now() + EVENT_PUSH_PROMPT_DELAY;
        const inspect = () => {
            if (busy.current) return;
            const preference = readPreference();
            const resuming = Boolean(userId && (preference.pendingAllUserId === userId || preference.pendingSetupUserId === userId));
            const registered = readBrowserPushRecord();
            if (!desktop.matches || document.visibilityState !== "visible" || browserPushAvailability() !== "ready"
                || preference.dismissedUntil > Date.now() || (registered?.userId === userId && !resuming)) {
                setView(null);
                return;
            }
            const fromLogin = Boolean(userId && returningFromLogin());
            if (Date.now() < showAfter) return;
            if (seenThisSession() && !resuming && !fromLogin) return;
            markSeen();
            setView("offer");
        };
        const timer = setTimeout(inspect, EVENT_PUSH_PROMPT_DELAY);
        const storage = (event: StorageEvent) => {
            if (event.key === PUSH_STORAGE_KEY || event.key === EVENT_PUSH_PROMPT_KEY) inspect();
        };
        desktop.addEventListener("change", inspect);
        window.addEventListener(PUSH_CHANGE_EVENT, inspect);
        window.addEventListener("storage", storage);
        window.addEventListener("focus", inspect);
        return () => {
            mounted.current = false;
            clearTimeout(timer);
            clearTimeout(successTimer.current);
            desktop.removeEventListener("change", inspect);
            window.removeEventListener(PUSH_CHANGE_EVENT, inspect);
            window.removeEventListener("storage", storage);
            window.removeEventListener("focus", inspect);
        };
    }, [userId]);

    function dismiss() {
        dismissed.current = true;
        clearTimeout(successTimer.current);
        savePreference({ ...readPreference(), dismissedUntil: Date.now() + EVENT_PUSH_PROMPT_SNOOZE });
        try { sessionStorage.removeItem(LOGIN_KEY); } catch { /* Optional login intent. */ }
        setView(null);
    }
    async function allow() {
        if (busy.current) return;
        if (!userId) {
            try { sessionStorage.setItem(LOGIN_KEY, String(Date.now())); } catch { /* Login still works without session storage. */ }
            const returnTo = window.location.pathname + window.location.search;
            router.push("/login?next=" + encodeURIComponent(returnTo));
            setView(null);
            return;
        }
        busy.current = true;
        setPending(true);
        setError(null);
        try {
            // Keep the permission request in this click's user gesture.
            const status = await enableBrowserPush(userId);
            if (status !== "enabled") {
                if (status === "denied" || status === "ready") { if (mounted.current) dismiss(); return; }
                throw new Error("이 브라우저에서 알림을 받을 수 없어요. 알림 설정을 확인해 주세요.");
            }
            if (getCurrentUserId() !== userId) throw new Error("로그인 상태가 변경되었어요. 다시 확인해 주세요.");
            savePreference({ ...readPreference(), pendingSetupUserId: userId });
            const subscriptions = SubscriptionsSchema.parse(await responseJson(await sessionFetch("/api/subscriptions")));
            if (getCurrentUserId() !== userId) throw new Error("로그인 상태가 변경되었어요. 다시 확인해 주세요.");
            const inputs = newEventSubscriptionInputs(subscriptions, readPreference().pendingAllUserId === userId);
            if (inputs.length > 0) savePreference({ ...readPreference(), pendingAllUserId: userId });
            for (const input of inputs) {
                if (getCurrentUserId() !== userId) throw new Error("로그인 상태가 변경되었어요. 다시 확인해 주세요.");
                SubscriptionSchema.parse(await responseJson(await sessionFetch("/api/subscriptions", {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
                })));
            }
            if (getCurrentUserId() !== userId) return;
            savePreference({ ...readPreference(), pendingAllUserId: null, pendingSetupUserId: null });
            try { sessionStorage.removeItem(LOGIN_KEY); } catch { /* Optional login intent. */ }
            if (mounted.current && !dismissed.current) {
                setView("success");
                successTimer.current = setTimeout(() => setView(null), 8_000);
            }
        } catch (caught) {
            if (mounted.current && !dismissed.current) setError(caught instanceof Error ? caught.message : "알림을 연결하지 못했어요. 다시 시도해 주세요.");
        } finally {
            busy.current = false;
            if (mounted.current) setPending(false);
        }
    }

    if (!view) return null;
    const prompt = <aside aria-label="새 행사 알림 안내" className="fixed bottom-5 left-5 z-[100] hidden w-[352px] rounded-2xl border border-border bg-background p-4 text-foreground shadow-lg shadow-black/10 lg:block">
        <button type="button" aria-label="새 행사 알림 안내 닫기" onClick={dismiss} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand"><X size={15} aria-hidden /></button>
        <div className="flex items-start gap-2.5 pr-6">
            {view === "success" ? <Check size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden /> : <Bell size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden />}
            <p className="text-[13px] font-medium leading-6">{view === "success" ? "새 행사 알림을 켰어요" : "새 행사가 올라오면 알려드릴게요"}</p>
        </div>
        {view === "success" ? <div role="status" className="mt-3 flex items-center justify-between pl-7 text-xs">
            <span className="text-muted-foreground">구독 조건은 언제든 바꿀 수 있어요</span>
            <Link href="/notifications?tab=subscriptions" className="rounded font-medium text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-brand">구독 설정</Link>
        </div> : <div className="mt-3 flex items-center justify-between gap-3 pl-7">
            <span className="text-xs text-muted-foreground">{userId ? "새 소식을 이 브라우저로 받아보세요" : "로그인 후 받을 수 있어요"}</span>
            <Button size="sm" className="h-8 shrink-0 rounded-lg px-3 text-xs" disabled={pending} aria-busy={pending} onClick={() => void allow()}>
                {pending && <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden />}
                {pending ? "연결 중" : error ? "다시 시도" : "알림 허용"}
            </Button>
        </div>}
        {error && <p role="alert" className="mt-3 break-words pl-7 text-xs leading-5 text-destructive">{error} <Link href="/notifications?tab=subscriptions" className="rounded underline">알림 설정</Link></p>}
    </aside>;
    // Keep the nonmodal prompt reachable when an intercepted detail dialog traps focus.
    return container ? createPortal(prompt, container) : prompt;
}
