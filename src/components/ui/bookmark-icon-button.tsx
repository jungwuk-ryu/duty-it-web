"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { checkSession, useAuth } from "@/src/lib/auth/client";
import { useBookmark } from "@/src/components/BookmarkProvider";
import type { BookmarkKind } from "@/src/lib/bookmarks";
import { cn } from "@/src/lib/utils";

const particles = Array.from({ length: 5 }, (_, index) => ({
    x: Math.cos(index / 5 * Math.PI * 2) * 22,
    y: Math.sin(index / 5 * Math.PI * 2) * 17,
    delay: index * 0.04,
}));

export function BookmarkIconButton({ kind, itemId, title, className, initialSaved = false }: {
    kind: BookmarkKind; itemId: number; title: string; className?: string; initialSaved?: boolean;
}) {
    const auth = useAuth();
    const { entry, toggle } = useBookmark(kind, itemId);
    const [burst, setBurst] = useState(0);
    const reducedMotion = useReducedMotion();
    const router = useRouter();
    const saved = Boolean(auth.user) && (entry?.saved ?? initialSaved);
    const pending = auth.status === "loading" || Boolean(auth.user && (!entry || entry.pending));
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
                <motion.span className="relative flex items-center justify-center" initial={false}
                    animate={{ scale: reducedMotion ? 1 : saved ? 1.1 : 1 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.85, rotate: saved ? 0 : -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                    {pending ? <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <>
                        <Bookmark size={18} className="opacity-60" aria-hidden />
                        <Bookmark size={18} className="absolute inset-0 fill-blue-500 text-blue-500 transition-opacity duration-300 motion-reduce:transition-none" aria-hidden style={{ opacity: saved ? 1 : 0 }} />
                    </>}
                    <AnimatePresence>
                        {saved && burst > 0 && !reducedMotion && <motion.span key={burst} className="pointer-events-none absolute inset-0 rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0) 80%)" }}
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4, 1], opacity: [0, 0.4, 0] }} transition={{ duration: 0.7, ease: "easeOut" }} />}
                    </AnimatePresence>
                </motion.span>
            </Button>
            <AnimatePresence>
                {saved && burst > 0 && !reducedMotion && <motion.span key={burst} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                    {particles.map((particle, index) => <motion.span key={index} className="absolute size-1 rounded-full bg-blue-500 blur-[1px]"
                        initial={{ scale: 0, opacity: 0.3, x: 0, y: 0 }}
                        animate={{ scale: [0, 1, 0], opacity: [0.3, 0.8, 0], x: [0, particle.x], y: [0, particle.y] }}
                        transition={{ duration: 0.65, delay: particle.delay, ease: "easeOut" }} />)}
                </motion.span>}
            </AnimatePresence>
            {entry?.error && <span role="alert" className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-destructive/20 bg-background p-3 text-xs leading-5 text-destructive shadow-md">{entry.error}</span>}
            <span className="sr-only" role="status">{saved ? "북마크에 저장됨" : ""}</span>
        </div>
    );
}
