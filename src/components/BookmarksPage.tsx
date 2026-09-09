"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, BriefcaseBusiness, CalendarDays, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { checkSession, responseJson, sessionFetch, useAuth } from "@/src/lib/auth/client";
import type { BookmarkKind } from "@/src/lib/bookmarks";
import { EventSchema, type Event } from "@/src/lib/schemas/event";
import { JobPostingSchema, type JobPosting } from "@/src/lib/schemas/job";
import { Button, buttonVariants } from "./ui/button";
import EventCard from "./ui/EventCard";
import JobPostingCard from "./ui/JobPostingCard";
import { cn } from "@/src/lib/utils";

const EventsPageSchema = z.object({ content: z.array(z.object({ id: z.number(), event: EventSchema.nullable() })), next: z.string().nullable() });
const JobsPageSchema = z.object({ content: z.array(JobPostingSchema), next: z.string().nullable() });
type Item = { id: number; event?: Event | null; job?: JobPosting };

export default function BookmarksPage({ kind }: { kind: BookmarkKind }) {
    const auth = useAuth();
    return <div className="mx-auto min-h-[65vh] max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Bookmark size={24} aria-hidden /></span>
            <div><h1 className="text-3xl font-bold tracking-tight text-foreground">내 북마크</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">관심 있는 행사와 채용 공고를 저장하고, 언제든 다시 찾아보세요.</p></div>
        </div>
        <nav className="mb-8 flex gap-2 border-b border-border pb-4" aria-label="북마크 분류">
            <Link href="/bookmarks" aria-current={kind === "events" ? "page" : undefined} className={buttonVariants({ variant: kind === "events" ? "default" : "outline", className: "gap-2" })}><CalendarDays size={16} aria-hidden />행사</Link>
            <Link href="/bookmarks?type=jobs" aria-current={kind === "jobs" ? "page" : undefined} className={buttonVariants({ variant: kind === "jobs" ? "default" : "outline", className: "gap-2" })}><BriefcaseBusiness size={16} aria-hidden />채용 공고</Link>
        </nav>
        {auth.status === "loading" ? <Loading /> : auth.user ? <SavedList key={`${auth.user.id}:${kind}`} kind={kind} />
            : auth.status === "error" ? <div role="alert" className="flex flex-col items-center gap-4 py-16"><p>{auth.message}</p><Button variant="outline" onClick={() => void checkSession()}>다시 시도</Button></div>
                : <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background px-5 py-16 text-center">
                    <Bookmark size={36} className="text-muted-foreground" aria-hidden />
                    <h2 className="text-xl font-bold">로그인하고 북마크를 모아보세요</h2>
                    <p className="text-sm text-muted-foreground">저장한 목록은 로그인한 계정에 보관돼요.</p>
                    <Button asChild><Link href={`/login?next=${encodeURIComponent(kind === "jobs" ? "/bookmarks?type=jobs" : "/bookmarks")}`}>로그인하기</Link></Button>
                </div>}
    </div>;
}

function SavedList({ kind }: { kind: BookmarkKind }) {
    const [items, setItems] = useState<Item[]>([]);
    const [next, setNext] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const controller = useRef<AbortController | null>(null);
    const retryCursor = useRef<string | null>(null);

    const load = useCallback(async (cursor: string | null = null) => {
        controller.current?.abort();
        const current = new AbortController();
        controller.current = current;
        retryCursor.current = cursor;
        try {
            const query = new URLSearchParams({ kind });
            if (cursor !== null) query.set("cursor", cursor);
            const body = await responseJson(await sessionFetch(`/api/bookmarks?${query}`, { signal: current.signal }));
            const result = kind === "events" ? EventsPageSchema.parse(body) : JobsPageSchema.parse(body);
            if (current.signal.aborted) return;
            const added: Item[] = kind === "events"
                ? EventsPageSchema.parse(body).content
                : JobsPageSchema.parse(body).content.map((job) => ({ id: job.id, job }));
            setItems((previous) => cursor === null ? added : Array.from(new Map([...previous, ...added].map((item) => [item.id, item])).values()));
            setNext(result.next);
        } catch {
            if (!current.signal.aborted) setError("북마크 목록을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        } finally { if (!current.signal.aborted) setLoading(false); }
    }, [kind]);

    const reload = useCallback((cursor: string | null = null) => {
        setLoading(true); setError(null);
        void load(cursor);
    }, [load]);

    useEffect(() => {
        // This fetch only updates React state after its asynchronous response settles.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
        const changed = (event: globalThis.Event) => {
            if ((event as CustomEvent<{ kind: BookmarkKind }>).detail.kind === kind) reload();
        };
        const resume = () => { if (document.visibilityState === "visible") reload(); };
        const storage = (event: StorageEvent) => { if (event.key === "duit-bookmark-change") resume(); };
        window.addEventListener("duit-bookmark-change", changed);
        window.addEventListener("focus", resume); window.addEventListener("online", resume); window.addEventListener("storage", storage);
        return () => {
            controller.current?.abort(); window.removeEventListener("duit-bookmark-change", changed);
            window.removeEventListener("focus", resume); window.removeEventListener("online", resume); window.removeEventListener("storage", storage);
        };
    }, [kind, load, reload]);

    return <section aria-label={kind === "events" ? "저장한 행사" : "저장한 채용 공고"} aria-busy={loading}>
        {kind === "jobs" && <p className="mb-5 text-sm text-muted-foreground">현재 공개 중인 채용 공고를 보여드려요. 공개가 종료된 공고는 목록에서 제외돼요.</p>}
        {items.length > 0 && <div className={cn("grid gap-5", kind === "events" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
            {items.map((item) => item.job ? <JobPostingCard key={item.id} job={item.job} /> : item.event ? <EventCard key={item.id} event={item.event} />
                : <div key={item.id} className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">이 행사는 현재 공개되지 않아 내용을 볼 수 없어요.</div>)}
        </div>}
        {error && <div className="mt-6 flex flex-col items-center gap-3" role="alert"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => reload(retryCursor.current)}>다시 시도</Button></div>}
        {loading && <Loading />}
        {!loading && !error && items.length === 0 && <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-background px-5 py-16 text-center">
            <Bookmark size={36} className="text-muted-foreground" aria-hidden />
            <h2 className="text-xl font-bold">아직 저장한 {kind === "events" ? "행사가" : "채용 공고가"} 없어요</h2>
            <p className="text-sm text-muted-foreground">마음에 드는 소식의 북마크 버튼을 눌러보세요.</p>
            <Button asChild variant="outline"><Link href={kind === "events" ? "/events" : "/jobs"}>{kind === "events" ? "행사" : "채용 공고"} 둘러보기</Link></Button>
        </div>}
        {!error && next !== null && <div className="mt-8 flex justify-center"><Button variant="outline" disabled={loading} onClick={() => reload(next)}>더 보기</Button></div>}
    </section>;
}

function Loading() { return <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground" role="status"><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />불러오는 중이에요</div>; }
