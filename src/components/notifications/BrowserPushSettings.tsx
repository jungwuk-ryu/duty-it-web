"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, LoaderCircle } from "lucide-react";
import { browserPushAvailability, disableBrowserPush, enableBrowserPush, synchronizeBrowserPush, type BrowserPushStatus } from "@/src/lib/notifications/push";
import { PUSH_CHANGE_EVENT, PUSH_STORAGE_KEY } from "@/src/lib/web-push";
import { Button } from "../ui/button";

const descriptions: Record<BrowserPushStatus | "checking", string> = {
    checking: "브라우저 알림 설정을 확인하고 있어요.",
    ready: "새 소식이 도착하면 이 브라우저로 알려드려요.",
    enabled: "이 브라우저에서 새 소식을 받고 있어요.",
    denied: "브라우저의 사이트 설정에서 듀잇 알림을 허용해 주세요. 알림함은 계속 이용할 수 있어요.",
    install: "iPhone·iPad에서는 공유 메뉴에서 ‘홈 화면에 추가’한 뒤, 홈 화면의 듀잇을 열어 알림을 켜 주세요. iOS 16.4 이상이 필요해요.",
    unsupported: "이 브라우저에서는 푸시 알림을 사용할 수 없어요. 알림함에서 새 소식을 확인해 주세요.",
    unconfigured: "브라우저 알림을 준비하고 있어요. 지금은 알림함에서 새 소식을 확인할 수 있어요.",
};

export default function BrowserPushSettings({ userId }: { userId: number }) {
    const [status, setStatus] = useState<BrowserPushStatus | "checking">("checking");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inspect = useCallback(async () => {
        return synchronizeBrowserPush(userId);
    }, [userId]);
    useEffect(() => {
        let canceled = false;
        const update = () => void inspect().then((next) => { if (!canceled) setStatus(next); })
            .catch(() => { if (!canceled) setError("브라우저 알림 설정을 확인하지 못했어요. 다시 시도해 주세요."); });
        const storage = (event: StorageEvent) => { if (event.key === PUSH_STORAGE_KEY) update(); };
        update();
        window.addEventListener(PUSH_CHANGE_EVENT, update);
        window.addEventListener("storage", storage);
        window.addEventListener("focus", update);
        return () => {
            canceled = true;
            window.removeEventListener(PUSH_CHANGE_EVENT, update);
            window.removeEventListener("storage", storage);
            window.removeEventListener("focus", update);
        };
    }, [inspect]);

    async function toggle() {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
            if (status === "enabled") {
                await disableBrowserPush();
                setStatus(browserPushAvailability());
            } else if (error) {
                setStatus(await inspect());
            } else {
                setStatus(await enableBrowserPush(userId));
            }
        } catch (caught) { setError(caught instanceof Error ? caught.message : "브라우저 알림을 설정하지 못했어요."); }
        finally { setPending(false); }
    }
    const actionable = status === "ready" || status === "enabled" || Boolean(error);
    return <section aria-labelledby="browser-push-title" className="mb-8 rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <BellRing size={22} className="mt-1 shrink-0 text-brand" aria-hidden />
                <div>
                    <h2 id="browser-push-title" className="font-bold text-foreground">이 브라우저에서 알림 받기</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{descriptions[status]}</p>
                    {status === "enabled" && <p className="mt-1 text-xs leading-5 text-muted-foreground">여기서 알림을 꺼도 다른 기기의 알림과 행사 구독은 유지돼요.</p>}
                </div>
            </div>
            <Button variant={status === "enabled" ? "outline" : "default"} disabled={pending || !actionable}
                className="shrink-0" onClick={() => void toggle()} aria-busy={pending}>
                {pending && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
                {error ? "다시 확인" : status === "enabled" ? "브라우저 알림 끄기" : status === "checking" ? "확인 중" : "브라우저 알림 켜기"}
            </Button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>;
}
