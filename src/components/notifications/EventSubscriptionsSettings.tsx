"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Plus, X } from "lucide-react";
import { z } from "zod";
import { responseJson, sessionFetch } from "@/src/lib/auth/client";
import {
    EventSubscriptionInputSchema, SubscriptionEventTypeSchema, SubscriptionSchema, SubscriptionsSchema,
    isEventSubscription, subscriptionLabel, type EventSubscription, type EventSubscriptionInput,
} from "@/src/lib/notifications";
import { EventTypeLabel } from "@/src/lib/schemas/event-type";
import { Button } from "../ui/button";

const HostsSchema = z.object({ hosts: z.array(z.object({ id: z.number().int().positive(), name: z.string() })) });
const inputClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50";

export default function EventSubscriptionsSettings({ initialHostId }: { initialHostId?: number }) {
    const [subscriptions, setSubscriptions] = useState<EventSubscription[]>([]);
    const [hosts, setHosts] = useState<z.infer<typeof HostsSchema>["hosts"]>([]);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [hostsLoading, setHostsLoading] = useState(true);
    const [hostsError, setHostsError] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [keyword, setKeyword] = useState("");
    const [hostId, setHostId] = useState(initialHostId ? String(initialHostId) : "");
    const busy = useRef(false);
    const controller = useRef<AbortController | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        const result = SubscriptionsSchema.parse(await responseJson(await sessionFetch("/api/subscriptions", { signal })));
        if (!signal?.aborted) { setSubscriptions(result.filter(isEventSubscription)); setLoading(false); setLoaded(true); }
    }, []);
    const loadHosts = useCallback(async (signal?: AbortSignal) => {
        try {
            const response = await fetch("/api/hosts", { signal });
            const result = HostsSchema.parse(await responseJson(response));
            if (!signal?.aborted) { setHosts(result.hosts); setHostsError(false); }
        } catch { if (!signal?.aborted) setHostsError(true); }
        finally { if (!signal?.aborted) setHostsLoading(false); }
    }, []);
    useEffect(() => {
        const current = new AbortController();
        controller.current = current;
        // React state changes only after the asynchronous request settles.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load(current.signal).catch(() => {
            if (!current.signal.aborted) { setLoading(false); setError("구독 목록을 불러오지 못했어요. 다시 시도해 주세요."); }
        });
        void loadHosts(current.signal);
        const resume = () => {
            if (!busy.current && document.visibilityState === "visible") void load(current.signal).catch(() => undefined);
        };
        window.addEventListener("focus", resume);
        return () => { current.abort(); window.removeEventListener("focus", resume); };
    }, [load, loadHosts]);

    async function create(input: EventSubscriptionInput) {
        const validated = EventSubscriptionInputSchema.parse(input);
        const result = SubscriptionSchema.parse(await responseJson(await sessionFetch("/api/subscriptions", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validated),
        })));
        if (isEventSubscription(result)) setSubscriptions((previous) => [...previous.filter((item) => item.id !== result.id), result]);
    }
    async function remove(id: number) {
        await responseJson(await sessionFetch("/api/subscriptions/" + id, { method: "DELETE" }));
        setSubscriptions((previous) => previous.filter((item) => item.id !== id));
    }
    async function run(action: () => Promise<void>, success: string) {
        if (busy.current) return;
        busy.current = true;
        setPending(true); setError(null); setMessage("");
        try { await action(); setMessage(success); }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : "구독을 저장하지 못했어요. 다시 시도해 주세요.");
            await load(controller.current?.signal).catch(() => {
                if (!controller.current?.signal.aborted) setLoaded(false);
            });
        } finally { busy.current = false; setPending(false); }
    }
    const types = SubscriptionEventTypeSchema.options;
    const allTypes = types.every((type) => subscriptions.some((item) => item.type === "EVENT_TYPE" && item.eventType === type));
    const disabled = loading || pending || !loaded;
    const listError = !loading && !loaded;

    function addKeyword(event: FormEvent) {
        event.preventDefault();
        const trimmed = keyword.trim();
        if (subscriptions.some((item) => item.type === "EVENT_KEYWORD" && item.keyword.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
            setError("이미 구독한 키워드예요."); return;
        }
        void run(async () => { await create({ type: "EVENT_KEYWORD", keyword: trimmed }); setKeyword(""); }, "키워드를 구독했어요.");
    }
    return <section aria-label="새 행사 구독 설정" aria-busy={pending || loading}>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">새 행사가 공개되면 구독 조건에 맞는 소식을 알려드려요. 구독 설정은 듀잇 앱과 함께 적용돼요.</p>
        {loading && <p role="status" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />구독을 확인하고 있어요</p>}
        {error && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3"><p className="text-sm text-destructive">{error}</p>
            {listError && <Button variant="outline" size="sm" onClick={() => void run(() => load(controller.current?.signal), "구독 목록을 다시 불러왔어요.")}>구독 다시 확인</Button>}</div>}
        {message && <p role="status" className="mb-5 text-sm text-brand">{message}</p>}
        <div className="divide-y divide-border rounded-2xl border border-border bg-background">
            <section className="p-5 sm:p-6" aria-labelledby="subscription-types-title">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="subscription-types-title" className="text-lg font-bold">관심 있는 행사 유형</h2>
                    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={allTypes} disabled={disabled || listError} className="size-4 accent-[var(--duit-brand)]"
                            onChange={() => void run(async () => {
                                if (allTypes) {
                                    for (const item of subscriptions) if (item.type === "EVENT_TYPE") await remove(item.id);
                                } else {
                                    for (const eventType of types) {
                                        if (!subscriptions.some((item) => item.type === "EVENT_TYPE" && item.eventType === eventType)) await create({ type: "EVENT_TYPE", eventType });
                                    }
                                }
                            }, allTypes ? "전체 유형 구독을 해제했어요." : "모든 행사 유형을 구독했어요.")} />
                        모든 행사 유형
                    </label>
                </div>
                <div className="flex flex-wrap gap-2">
                    {types.map((eventType) => {
                        const saved = subscriptions.find((item) => item.type === "EVENT_TYPE" && item.eventType === eventType);
                        return <Button key={eventType} type="button" variant={saved ? "default" : "outline"} className="rounded-full"
                            aria-pressed={Boolean(saved)} disabled={disabled || listError}
                            onClick={() => void run(() => saved ? remove(saved.id) : create({ type: "EVENT_TYPE", eventType }), saved ? "유형 구독을 해제했어요." : "행사 유형을 구독했어요.")}>
                            {saved && <Check size={15} aria-hidden />}{EventTypeLabel[eventType]}
                        </Button>;
                    })}
                </div>
            </section>
            <section className="p-5 sm:p-6" aria-labelledby="subscription-keywords-title">
                <h2 id="subscription-keywords-title" className="text-lg font-bold">관심 키워드</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">행사 제목에 입력한 키워드가 포함되면 알려드려요.</p>
                <form className="mt-4 flex gap-2" onSubmit={addKeyword}>
                    <input aria-label="새 행사 구독 키워드" placeholder="예: 중환자, 간호 연구" value={keyword} maxLength={50} required
                        disabled={disabled || listError} className={inputClass} onChange={(event) => setKeyword(event.target.value)} />
                    <Button type="submit" className="h-11 shrink-0" disabled={disabled || listError || !keyword.trim()}><Plus size={16} aria-hidden />추가</Button>
                </form>
                <SubscriptionChips subscriptions={subscriptions.filter((item) => item.type === "EVENT_KEYWORD")} disabled={disabled}
                    remove={(item) => void run(() => remove(item.id), "키워드 구독을 해제했어요.")} />
            </section>
            <section className="p-5 sm:p-6" aria-labelledby="subscription-hosts-title">
                <h2 id="subscription-hosts-title" className="text-lg font-bold">관심 주최자</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">선택한 주최자가 새 행사를 공개하면 알려드려요.</p>
                <form className="mt-4 flex gap-2" onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => { await create({ type: "EVENT_HOST", hostId: Number(hostId) }); setHostId(""); }, "주최자를 구독했어요.");
                }}>
                    <select aria-label="구독할 주최자" value={hostId} disabled={disabled || listError || hostsLoading || hostsError} className={inputClass} required onChange={(event) => setHostId(event.target.value)}>
                        <option value="">{hostsLoading ? "주최자를 불러오는 중" : "주최자를 선택해 주세요"}</option>
                        {hosts.map((host) => <option key={host.id} value={host.id} disabled={subscriptions.some((item) => item.type === "EVENT_HOST" && item.host.id === host.id)}>{host.name}</option>)}
                    </select>
                    <Button type="submit" className="h-11 shrink-0" disabled={disabled || listError || hostsError || !hostId || subscriptions.some((item) => item.type === "EVENT_HOST" && item.host.id === Number(hostId))}><Plus size={16} aria-hidden />추가</Button>
                </form>
                {hostsError && <p role="alert" className="mt-3 text-sm text-destructive">주최자 목록을 불러오지 못했어요. <button type="button" className="rounded underline" onClick={() => void loadHosts(controller.current?.signal)}>다시 확인</button></p>}
                <SubscriptionChips subscriptions={subscriptions.filter((item) => item.type === "EVENT_HOST")} disabled={disabled}
                    remove={(item) => void run(() => remove(item.id), "주최자 구독을 해제했어요.")} />
            </section>
        </div>
    </section>;
}

function SubscriptionChips({ subscriptions, disabled, remove }: { subscriptions: EventSubscription[]; disabled: boolean; remove: (item: EventSubscription) => void }) {
    return subscriptions.length > 0 ? <ul className="mt-4 flex flex-wrap gap-2">
        {subscriptions.map((item) => <li key={item.id} className="flex max-w-full items-center gap-2 rounded-full bg-muted py-1 pl-4 pr-1 text-sm">
            <span className="break-words">{subscriptionLabel(item)}</span>
            <button type="button" disabled={disabled} onClick={() => remove(item)} aria-label={subscriptionLabel(item) + " 구독 해제"}
                className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-background focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"><X size={14} aria-hidden /></button>
        </li>)}
    </ul> : null;
}
