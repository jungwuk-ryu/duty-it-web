import { BookmarkToggleSchema, type BookmarkKind } from "./bookmarks";

type Entry = { saved?: boolean; pending: boolean; error: string | null };
type Entries = Record<string, Entry>;
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
type Cached = Record<string, { saved: boolean; at: number }>;
const EMPTY: Entries = {};
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const keyOf = (kind: BookmarkKind, id: number) => `${kind}:${id}`;

// Display hints only: no credentials, and never used to authorize a request.
function readCache(storage: Storage | undefined, key: string): Cached {
    try {
        const value = JSON.parse(storage?.getItem(key) ?? "null");
        if (value?.version !== 1 || !value.entries || typeof value.entries !== "object") return {};
        return Object.fromEntries(Object.entries(value.entries).filter(([id, entry]) => {
            const item = entry as { saved?: unknown; at?: unknown } | null;
            return /^(events|jobs):[1-9]\d*$/.test(id) && item && typeof item.saved === "boolean"
                && typeof item.at === "number" && item.at <= Date.now() && item.at > Date.now() - MAX_AGE;
        })) as Cached;
    } catch { return {}; }
}

export function createBookmarkStore({ userId, storage, request, changed }: {
    userId?: number;
    storage?: Storage;
    request: (kind: BookmarkKind, id: number, toggle: boolean) => Promise<unknown>;
    changed: (kind: BookmarkKind, id: number, saved: boolean) => void;
}) {
    const storageKey = `duit-bookmarks:v1:${userId}`;
    let entries: Entries = userId ? Object.fromEntries(Object.entries(readCache(storage, storageKey))
        .map(([key, value]) => [key, { saved: value.saved, pending: false, error: null }])) : EMPTY;
    const listeners = new Set<() => void>();
    const reads = new Map<string, Promise<void>>();
    const checked = new Set<string>();
    const writes = new Set<string>();

    function update(key: string, entry: Entry) {
        entries = { ...entries, [key]: entry };
        listeners.forEach((listener) => listener());
    }

    function remember(key: string, saved: boolean) {
        try {
            const cached = { ...readCache(storage, storageKey), [key]: { saved, at: Date.now() } };
            const recent = Object.entries(cached).sort((a, b) => b[1].at - a[1].at).slice(0, 500);
            storage?.setItem(storageKey, JSON.stringify({ version: 1, entries: Object.fromEntries(recent) }));
        } catch { /* Private browsing and storage limits must not break bookmarks. */ }
    }

    function load(kind: BookmarkKind, id: number, force = false): Promise<void> {
        const key = keyOf(kind, id);
        if (!userId || writes.has(key)) return Promise.resolve();
        const existing = reads.get(key);
        if (existing) return existing;
        if (!force && checked.has(key)) return Promise.resolve();
        checked.add(key);
        const read = (async () => {
            try {
                const { isBookmarked: saved } = BookmarkToggleSchema.parse(await request(kind, id, false));
                update(key, { saved, pending: writes.has(key), error: null });
                remember(key, saved);
            } catch {
                update(key, { saved: entries[key]?.saved, pending: writes.has(key), error: "북마크 상태를 확인하지 못했어요. 다시 시도해 주세요." });
            } finally { reads.delete(key); }
        })();
        reads.set(key, read);
        return read;
    }

    async function toggle(kind: BookmarkKind, id: number) {
        const key = keyOf(kind, id);
        if (!userId || writes.has(key)) return;
        // After an uncertain POST, the next click only reconciles the server state.
        const recheckOnly = Boolean(entries[key]?.error);
        const ready = reads.get(key) ?? (entries[key]?.saved === undefined || recheckOnly ? load(kind, id, true) : Promise.resolve());
        writes.add(key);
        update(key, { saved: entries[key]?.saved, pending: true, error: null });
        try {
            await ready;
            if (recheckOnly || entries[key]?.error || entries[key]?.saved === undefined) return;
            const { isBookmarked: saved } = BookmarkToggleSchema.parse(await request(kind, id, true));
            update(key, { saved, pending: true, error: null });
            remember(key, saved);
            changed(kind, id, saved);
        } catch {
            update(key, { saved: entries[key]?.saved, pending: true, error: "저장 결과를 확인하지 못했어요. 다시 눌러 상태를 확인해 주세요." });
        } finally {
            writes.delete(key);
            update(key, { ...entries[key], pending: false });
        }
    }

    return {
        subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
        getSnapshot: () => entries,
        getServerSnapshot: () => EMPTY,
        load,
        toggle,
        recheck() {
            // Only revalidate items seen on this visit, not every persisted bookmark.
            for (const key of checked) {
                const [kind, id] = key.split(":");
                void load(kind as BookmarkKind, Number(id), true);
            }
        },
    };
}
