"use client";

import { useState, type CSSProperties } from "react";
import { Bookmark, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { checkSession, useAuth } from "@/src/lib/auth/client";
import { useBookmark } from "@/src/components/BookmarkProvider";
import type { BookmarkKind } from "@/src/lib/bookmarks";
import { cn } from "@/src/lib/utils";
import styles from "./bookmark-icon-button.module.css";

const particles = Array.from({ length: 5 }, (_, index) => ({
    "--x": `${Math.cos(index / 5 * Math.PI * 2) * 22}px`,
    "--y": `${Math.sin(index / 5 * Math.PI * 2) * 17}px`,
    "--delay": `${index * 40}ms`,
}) as CSSProperties);

export function BookmarkIconButton({ kind, itemId, title, className, initialSaved = false }: {
    kind: BookmarkKind; itemId: number; title: string; className?: string; initialSaved?: boolean;
}) {
    const auth = useAuth();
    const { entry, toggle } = useBookmark(kind, itemId);
    const [burst, setBurst] = useState(0);
    const router = useRouter();
    const saved = Boolean(auth.user) && (entry?.saved ?? initialSaved);
    const pending = Boolean(auth.user && entry?.pending);
    const label = entry?.error ? `${title} 북마크 상태 다시 확인` : `${title} 북마크 ${saved ? "해제" : "저장"}`;

    async function handleClick() {
        if (auth.status === "error") { await checkSession(); return; }
        if (!auth.user) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
        }
        if (!saved && !entry?.error) setBurst((value) => value + 1);
        await toggle();
    }

    return (
        <div className={cn("relative flex shrink-0 items-center justify-center", className)}>
            <Button type="button" variant="ghost" size="icon" className="size-11 rounded-full" onClick={() => void handleClick()}
                disabled={pending} aria-pressed={saved} aria-label={label} aria-busy={pending} title={entry?.error ?? label}>
                <span className={cn("relative flex items-center justify-center", styles.icon)} data-saved={saved}>
                    {pending ? <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <>
                        <Bookmark size={18} className="opacity-60" aria-hidden />
                        <Bookmark size={18} className="absolute inset-0 fill-blue-500 text-blue-500 transition-opacity duration-300 motion-reduce:transition-none" aria-hidden style={{ opacity: saved ? 1 : 0 }} />
                    </>}
                    {saved && burst > 0 && <span key={burst} className={cn("pointer-events-none absolute inset-0 rounded-full", styles.burst)} />}
                </span>
            </Button>
            {saved && burst > 0 && <span key={burst} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                {particles.map((style, index) => <span key={index} className={cn("absolute size-1 rounded-full bg-blue-500 blur-[1px]", styles.particle)} style={style} />)}
            </span>}
            {entry?.error && <span role="alert" className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-destructive/20 bg-background p-3 text-xs leading-5 text-destructive shadow-md">{entry.error}</span>}
            <span className="sr-only" role="status">{saved ? "북마크에 저장됨" : ""}</span>
        </div>
    );
}
