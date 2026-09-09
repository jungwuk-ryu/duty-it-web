"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { responseJson, sessionFetch, useAuth } from "@/src/lib/auth/client";
import { BookmarkToggleSchema, type BookmarkKind } from "@/src/lib/bookmarks";

type Entry = { saved: boolean; pending: boolean; error: string | null };
type Store = {
    entries: Record<string, Entry>;
    load: (kind: BookmarkKind, id: number, force?: boolean) => Promise<void>;
    toggle: (kind: BookmarkKind, id: number) => Promise<void>;
};
const Context = createContext<Store | null>(null);
const keyOf = (kind: BookmarkKind, id: number) => `${kind}:${id}`;

export default function BookmarkProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    return <AccountBookmarks key={user?.id ?? "guest"} userId={user?.id}>{children}</AccountBookmarks>;
}

function AccountBookmarks({ children, userId }: { children: React.ReactNode; userId?: number }) {
    const [entries, setEntries] = useState<Record<string, Entry>>({});
    const cache = useRef<Record<string, Entry>>({});
    const inFlight = useRef(new Set<string>());
    const update = useCallback((key: string, entry: Entry) => {
        cache.current = { ...cache.current, [key]: entry };
        setEntries(cache.current);
    }, []);

    const load = useCallback(async (kind: BookmarkKind, id: number, force = false) => {
        if (!userId) return;
        const key = keyOf(kind, id);
        if (inFlight.current.has(key) || (!force && cache.current[key])) return;
        inFlight.current.add(key);
        update(key, { saved: cache.current[key]?.saved ?? false, pending: true, error: null });
        try {
            const body = await responseJson(await sessionFetch(`/api/bookmarks/${kind}/${id}`));
            const parsed = BookmarkToggleSchema.parse(body);
            update(key, { saved: parsed.isBookmarked, pending: false, error: null });
        } catch {
            update(key, { saved: cache.current[key]?.saved ?? false, pending: false, error: "북마크 상태를 확인하지 못했어요. 다시 시도해 주세요." });
        } finally { inFlight.current.delete(key); }
    }, [userId, update]);

    const toggle = useCallback(async (kind: BookmarkKind, id: number) => {
        const key = keyOf(kind, id);
        if (!userId || inFlight.current.has(key)) return;
        if (cache.current[key]?.error || !cache.current[key]) { await load(kind, id, true); return; }
        const previous = cache.current[key].saved;
        inFlight.current.add(key);
        update(key, { saved: previous, pending: true, error: null });
        try {
            const body = await responseJson(await sessionFetch(`/api/bookmarks/${kind}/${id}`, { method: "POST" }));
            const parsed = BookmarkToggleSchema.parse(body);
            update(key, { saved: parsed.isBookmarked, pending: false, error: null });
            window.dispatchEvent(new CustomEvent("duit-bookmark-change", { detail: { kind, id, saved: parsed.isBookmarked } }));
            try { localStorage.setItem("duit-bookmark-change", JSON.stringify({ kind, id, at: Date.now() })); } catch { /* Optional cross-tab signal. */ }
        } catch {
            // A lost response may have changed the server. Recheck before another toggle.
            update(key, { saved: previous, pending: false, error: "저장 결과를 확인하지 못했어요. 다시 눌러 상태를 확인해 주세요." });
        } finally { inFlight.current.delete(key); }
    }, [userId, load, update]);

    useEffect(() => {
        const recheck = () => {
            if (document.visibilityState !== "visible") return;
            Object.keys(cache.current).forEach((key) => {
                const [kind, id] = key.split(":");
                void load(kind as BookmarkKind, Number(id), true);
            });
        };
        const storage = (event: StorageEvent) => { if (event.key === "duit-bookmark-change") recheck(); };
        window.addEventListener("focus", recheck); window.addEventListener("online", recheck); window.addEventListener("storage", storage);
        return () => { window.removeEventListener("focus", recheck); window.removeEventListener("online", recheck); window.removeEventListener("storage", storage); };
    }, [load]);

    return <Context.Provider value={{ entries, load, toggle }}>{children}</Context.Provider>;
}

export function useBookmark(kind: BookmarkKind, id: number) {
    const store = useContext(Context);
    if (!store) throw new Error("BookmarkProvider is required.");
    const { load } = store;
    useEffect(() => { void load(kind, id); }, [kind, id, load]);
    return { entry: store.entries[keyOf(kind, id)], toggle: () => store.toggle(kind, id) };
}
