"use client";

import { useId, useSyncExternalStore } from "react";
import { isAnalyticsOptedOut, setAnalyticsOptOut, subscribeAnalyticsOptOut } from "@/src/lib/analytics-opt-out";
import { cn } from "@/src/lib/utils";

export default function AnalyticsOptOut() {
    const id = useId();
    // null until hydration: the stored choice exists only in this browser.
    const optedOut = useSyncExternalStore<boolean | null>(subscribeAnalyticsOptOut, isAnalyticsOptedOut, () => null);
    const status = optedOut === null ? "설정을 확인하고 있어요."
        : optedOut ? "현재 이 브라우저에서는 이용 통계를 수집하지 않아요."
            : "현재 이 브라우저의 이용 통계를 수집하고 있어요. 켜면 즉시 수집을 중단해요.";

    return (
        <div className="flex items-center justify-between gap-5 rounded-xl border border-border bg-background p-5">
            <div className="min-w-0">
                <p id={`${id}-label`} className="font-semibold text-foreground">이 브라우저에서 이용 통계 수집 거부</p>
                <p id={`${id}-status`} className="mt-1 text-sm leading-6 text-muted-foreground" aria-live="polite">{status}</p>
                <p className="mt-1 text-xs leading-5 text-subtle-foreground">이 설정은 이 브라우저에만 저장돼요. 브라우저 저장소를 지우면 다시 설정해 주세요.</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={optedOut === true}
                aria-labelledby={`${id}-label`}
                aria-describedby={`${id}-status`}
                disabled={optedOut === null}
                onClick={() => setAnalyticsOptOut(!optedOut)}
                className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 motion-reduce:transition-none",
                    optedOut ? "bg-primary" : "bg-input",
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        "inline-block size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
                        optedOut ? "translate-x-6" : "translate-x-1",
                    )}
                />
            </button>
        </div>
    );
}
