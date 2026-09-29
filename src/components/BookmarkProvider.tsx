"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { responseJson, sessionFetch, useAuth } from "@/src/lib/auth/client";
import { createBookmarkStore } from "@/src/lib/bookmark-store";
import type { BookmarkKind } from "@/src/lib/bookmarks";

const Context = createContext<ReturnType<typeof createBookmarkStore> | null>(null);

export default function BookmarkProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    return <AccountBookmarks key={user?.id ?? "guest"} userId={user?.id}>{children}</AccountBookmarks>;
}

function browserStorage() {
    try { return window.localStorage; } catch { return undefined; }
}

function AccountBookmarks({ children, userId }: { children: React.ReactNode; userId?: number }) {
    const [store] = useState(() => createBookmarkStore({
        userId,
        storage: browserStorage(),
        request: async (kind, id, toggle) => responseJson(await sessionFetch(`/api/bookmarks/${kind}/${id}`, { method: toggle ? "POST" : "GET" })),
        changed(kind, id, saved) {
            window.dispatchEvent(new CustomEvent("duit-bookmark-change", { detail: { kind, id, saved } }));
            try { localStorage.setItem("duit-bookmark-change", JSON.stringify({ kind, id, at: Date.now() })); } catch { /* Optional cross-tab signal. */ }
        },
    }));

    useEffect(() => {
        const recheck = () => { if (document.visibilityState === "visible") store.recheck(); };
        const storage = (event: StorageEvent) => { if (event.key === "duit-bookmark-change") recheck(); };
        window.addEventListener("focus", recheck); window.addEventListener("online", recheck); window.addEventListener("storage", storage);
        return () => { window.removeEventListener("focus", recheck); window.removeEventListener("online", recheck); window.removeEventListener("storage", storage); };
    }, [store]);

    return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useBookmark(kind: BookmarkKind, id: number) {
    const store = useContext(Context);
    if (!store) throw new Error("BookmarkProvider is required.");
    const entries = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
    useEffect(() => { void store.load(kind, id); }, [kind, id, store]);
    return { entry: entries[`${kind}:${id}`], toggle: () => store.toggle(kind, id) };
}
