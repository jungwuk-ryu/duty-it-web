"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, LoaderCircle, RefreshCw } from "lucide-react";
import { responseJson, sessionFetch } from "@/src/lib/auth/client";
import { NotificationsPageSchema, formatNotificationDate, type NotificationSummary } from "@/src/lib/notifications";
import { NOTIFICATIONS_CHANGE_EVENT } from "@/src/lib/web-push";
import { useNotifications } from "../NotificationProvider";
import { Button } from "../ui/button";
import { cn } from "@/src/lib/utils";

export default function NotificationInbox({ unread }: { unread: boolean }) {
    const { refresh, unreadCount } = useNotifications();
    const [items, setItems] = useState<NotificationSummary[]>([]);
    const [next, setNext] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState<number | "all" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const controller = useRef<AbortController | null>(null);
    const retryPage = useRef(0);
    const mutation = useRef(false);
    const load = useCallback(async (page = 0) => {
        controller.current?.abort();
        const current = new AbortController();
        controller.current = current;
        retryPage.current = page;
        try {
            const params = new URLSearchParams({ page: String(page), unread: String(unread) });
            const result = NotificationsPageSchema.parse(await responseJson(await sessionFetch("/api/notifications?" + params, { signal: current.signal })));
            if (current.signal.aborted) return;
            setItems((previous) => page === 0 ? result.content : [...new Map([...previous, ...result.content].map((item) => [item.id, item])).values()]);
            setNext(result.next);
            setError(null);
        } catch {
            if (!current.signal.aborted) setError("알림을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        } finally { if (!current.signal.aborted) setLoading(false); }
    }, [unread]);
    const reload = useCallback((page = 0) => { setLoading(true); void load(page); }, [load]);
    useEffect(() => {
        // React state changes only after the asynchronous request settles.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
        const resume = () => { if (document.visibilityState === "visible" && !mutation.current) reload(); };
        const incoming = (event: Event) => {
            if ((event as CustomEvent<{ incoming?: boolean }>).detail?.incoming) resume();
        };
        window.addEventListener("focus", resume);
        window.addEventListener("online", resume);
        window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, incoming);
        document.addEventListener("visibilitychange", resume);
        return () => {
            controller.current?.abort();
            window.removeEventListener("focus", resume);
            window.removeEventListener("online", resume);
            window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, incoming);
            document.removeEventListener("visibilitychange", resume);
        };
    }, [load, reload]);

    async function markRead(item?: NotificationSummary) {
        if (mutation.current || item?.isRead) return;
        mutation.current = true;
        setPending(item?.id ?? "all");
        setError(null);
        try {
            const path = item ? "/api/notifications/" + item.id + "/read" : "/api/notifications/read-all";
            await responseJson(await sessionFetch(path, { method: "PATCH" }));
            setItems((previous) => unread ? previous.filter((row) => item && row.id !== item.id)
                : previous.map((row) => !item || row.id === item.id ? { ...row, isRead: true } : row));
            refresh();
        } catch { setError("읽음 표시를 저장하지 못했어요. 다시 시도해 주세요."); }
        finally { mutation.current = false; setPending(null); }
    }
    return <section aria-label="알림 목록" aria-busy={loading}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">최신 소식부터 보여드려요.</p>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={loading || pending !== null} onClick={() => reload()}><RefreshCw size={15} aria-hidden />새로고침</Button>
                <Button variant="outline" size="sm" disabled={loading || pending !== null || (unreadCount === 0 && !items.some((row) => !row.isRead))} onClick={() => void markRead()}>
                    <CheckCheck size={16} aria-hidden />모두 읽음
                </Button>
            </div>
        </div>
        {items.length > 0 && <ul className="overflow-hidden rounded-2xl border border-border bg-background">
            {items.map((item) => <li key={item.id} className={cn("flex items-start gap-3 border-b border-border p-5 last:border-b-0 sm:gap-4 sm:p-6", !item.isRead && "bg-brand/[0.04]")}>
                <span className={cn("mt-1 flex size-9 shrink-0 items-center justify-center rounded-full", item.isRead ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand")}><Bell size={18} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className={item.isRead ? "text-muted-foreground" : "font-semibold text-brand"}>{item.reason}</span>
                        {!item.isRead && <span className="font-semibold text-brand">안 읽음</span>}
                    </div>
                    <Link href={item.href} prefetch={false} onClick={() => { if (!item.isRead) void markRead(item); }}
                        className="mt-2 block break-words rounded text-base font-bold leading-7 text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{item.title}</Link>
                    {item.description && <p className="mt-1 break-words text-sm text-muted-foreground">{item.description}</p>}
                    <time dateTime={item.createdAt} className="mt-3 block text-xs text-subtle-foreground">{formatNotificationDate(item.createdAt)}</time>
                    {!item.isRead && <button type="button" disabled={pending !== null} onClick={() => void markRead(item)}
                        className="mt-3 min-h-8 rounded px-1 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">
                        {pending === item.id ? "저장 중" : "읽음 표시"}
                    </button>}
                </div>
            </li>)}
        </ul>}
        {error && <div role="alert" className="my-5 flex flex-col items-center gap-3"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => reload(retryPage.current)}>다시 시도</Button></div>}
        {loading && <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />알림을 불러오고 있어요</div>}
        {!loading && !error && items.length === 0 && <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-background px-5 py-14 text-center">
            <Bell size={32} className="text-muted-foreground" aria-hidden />
            <h2 className="text-xl font-bold">{unread ? "새로 확인할 알림이 없어요" : "아직 도착한 알림이 없어요"}</h2>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">관심 있는 행사 유형이나 키워드를 구독하면 새 행사가 공개될 때 알려드려요.</p>
            <Button asChild variant="outline"><Link href="/notifications?tab=subscriptions">행사 구독 설정하기</Link></Button>
        </div>}
        {!error && next !== null && <div className="mt-6 flex justify-center"><Button variant="outline" disabled={loading} onClick={() => reload(next)}>알림 더 보기</Button></div>}
    </section>;
}
