"use client";

import EventFiltersForm from "@/src/components/EventFiltersForm";
import EventsDiscovery from "@/src/components/EventsDiscovery";
import EventListScaffold from "@/src/components/EventListScaffold";
import EventCard from "@/src/components/ui/EventCard";
import {
    getEventPageRequestFromUrlSearchParams,
    getEventsHref,
    getEventsSearchParams,
    getSortLabel,
    isEventListView,
    type EventFilters,
    type EventPageRequest,
    type EventSortField,
} from "@/src/lib/event-query";
import type { Event } from "@/src/lib/schemas/event";
import type { EventResponse } from "@/src/lib/schemas/events-response";
import type { EventStatusFilter } from "@/src/lib/event-query";
import type { EventType } from "@/src/lib/schemas/event-type";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";

type Option<T extends string> = { value: T; label: string };

type Props = {
    categoryExplore: ReactNode;
    initialData: EventResponse;
    initialIsListView: boolean;
    initialRequest: EventPageRequest;
    sortOptions: readonly Option<EventSortField>[];
    statusOptions: readonly Option<EventStatusFilter>[];
    typeOptions: readonly Option<EventType>[];
};

type HistoryMode = "none" | "push" | "replace";
type CachedPage = { data: EventResponse; expiresAt: number };
type HostOption = { id: number; name: string };
type EventWire = Omit<Event, "startAt" | "endAt" | "recruitmentStartAt" | "recruitmentEndAt"> & {
    startAt: string;
    endAt: string | null;
    recruitmentStartAt: string | null;
    recruitmentEndAt: string | null;
};
type EventsResponseWire = Omit<EventResponse, "content"> & { content: EventWire[] };

const CLIENT_PAGE_CACHE_TTL = 30_000;
const MAX_CLIENT_PAGE_CACHE_ENTRIES = 24;
const pageCache = new Map<string, CachedPage>();
const PAGINATION_BUTTON_CLASS = "inline-flex h-10 items-center gap-1 rounded-lg border border-input bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-border disabled:bg-canvas disabled:text-subtle-foreground disabled:hover:border-border disabled:hover:text-subtle-foreground";

export default function EventsResults({
    categoryExplore,
    initialData,
    initialIsListView,
    initialRequest,
    sortOptions,
    statusOptions,
    typeOptions,
}: Props) {
    const searchParams = useSearchParams();
    const isListView = isEventListView(Object.fromEntries(searchParams));
    const [request, setRequest] = useState<EventPageRequest>(initialRequest);
    const [events, setEvents] = useState<EventResponse | null>(initialData);
    const [error, setError] = useState<EventsClientFetchError | null>(null);
    const [hostOptions, setHostOptions] = useState<HostOption[]>([]);
    const [hostsLoadError, setHostsLoadError] = useState(false);
    const [isHostsLoading, setIsHostsLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [previousRequests, setPreviousRequests] = useState<EventPageRequest[]>([]);
    const activeRequestKeyRef = useRef(getRequestKey(initialRequest));
    const controllerRef = useRef<AbortController | null>(null);
    const eventListRef = useRef<HTMLElement | null>(null);
    const requestRef = useRef(initialRequest);
    const requestVersionRef = useRef(0);
    const pageTopRef = useRef<HTMLDivElement | null>(null);
    const viewTransitionRef = useRef<ViewTransition | null>(null);

    const transitionView = useCallback((update: () => void) => {
        viewTransitionRef.current?.skipTransition();
        const applyUpdate = () => {
            flushSync(update);
            pageTopRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
            pageTopRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
        };
        if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            applyUpdate();
            return;
        }
        const transition = document.startViewTransition(applyUpdate);
        viewTransitionRef.current = transition;
        // A superseded or offscreen transition may skip its animation; the update still runs.
        void transition.ready.catch(() => {});
    }, []);

    const scrollToEventList = useCallback(() => {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        window.requestAnimationFrame(() => {
            eventListRef.current?.scrollIntoView({ behavior, block: "start" });
        });
    }, []);

    const loadPage = useCallback(async (
        nextRequest: EventPageRequest,
        historyMode: HistoryMode = "push",
        force = false,
        shouldScrollToEventList = false,
    ) => {
        const requestKey = getRequestKey(nextRequest);
        if (historyMode === "push") {
            window.history.pushState(null, "", getEventsHref(nextRequest, nextRequest.cursor));
        } else if (historyMode === "replace") {
            window.history.replaceState(null, "", getEventsHref(nextRequest, nextRequest.cursor));
        }
        document.title = getDocumentTitle(nextRequest);
        if (!force && requestKey === activeRequestKeyRef.current) return;

        activeRequestKeyRef.current = requestKey;
        requestRef.current = nextRequest;
        controllerRef.current?.abort();
        const requestVersion = ++requestVersionRef.current;
        const cached = getCachedPage(requestKey);

        setRequest(nextRequest);
        setError(null);
        if (shouldScrollToEventList) scrollToEventList();

        if (cached != null) {
            setEvents(cached);
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        controllerRef.current = controller;
        setEvents(null);
        setIsLoading(true);

        try {
            const result = await fetchEventsPage(nextRequest, controller.signal);
            if (requestVersion !== requestVersionRef.current) return;

            cachePage(requestKey, result);
            setEvents(result);
        } catch (caughtError) {
            if (controller.signal.aborted || requestVersion !== requestVersionRef.current) return;

            setError(toClientFetchError(caughtError));
        } finally {
            if (requestVersion === requestVersionRef.current) {
                setIsLoading(false);
            }
        }
    }, [scrollToEventList]);

    useEffect(() => {
        cachePage(getRequestKey(initialRequest), initialData);
        return () => controllerRef.current?.abort();
    }, [initialData, initialRequest]);

    useEffect(() => {
        if (!isListView) return;
        const controller = new AbortController();

        const loadHostOptions = async () => {
            try {
                const response = await fetch("/api/hosts", {
                    headers: { Accept: "application/json" },
                    signal: controller.signal,
                });
                const payload: unknown = await response.json().catch(() => null);
                const parsedHostOptions = getHostOptions(payload);

                if (!response.ok || parsedHostOptions == null) {
                    throw new Error("Failed to fetch host options.");
                }

                setHostOptions(parsedHostOptions);
            } catch {
                if (!controller.signal.aborted) setHostsLoadError(true);
            } finally {
                if (!controller.signal.aborted) setIsHostsLoading(false);
            }
        };

        void loadHostOptions();
        return () => controller.abort();
    }, [isListView]);

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const nextRequest = getEventPageRequestFromUrlSearchParams(params);
            const shouldScrollToEventList = nextRequest.cursor !== requestRef.current.cursor;
            setPreviousRequests([]);
            void loadPage(nextRequest, "none", false, shouldScrollToEventList);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [loadPage]);

    const handleExplore = (nextRequest: EventPageRequest) => {
        transitionView(() => {
            setPreviousRequests([]);
            void loadPage(nextRequest);
        });
    };

    const handleFiltersChange = (filters: EventFilters, historyMode: "push" | "replace" = "push") => {
        setPreviousRequests([]);
        void loadPage({ ...filters, cursor: null }, historyMode);
    };

    const handleReset = () => {
        setPreviousRequests([]);
        void loadPage({
            cursor: null,
            field: "CREATED_AT",
            hostId: null,
            searchKeyword: "",
            statusGroup: "ACTIVE",
            types: [],
        });
    };

    const handleNextPage = () => {
        const nextCursor = events?.pageInfo.hasNext ? events.pageInfo.nextCursor : null;
        if (nextCursor == null) return;

        setPreviousRequests((currentPreviousRequests) => [...currentPreviousRequests, request]);
        void loadPage({ ...request, cursor: nextCursor }, "push", false, true);
    };

    const handlePreviousPage = () => {
        const previousRequest = previousRequests[previousRequests.length - 1];
        if (previousRequest != null) {
            setPreviousRequests((currentPreviousRequests) => currentPreviousRequests.slice(0, -1));
            void loadPage(previousRequest, "replace", false, true);
            return;
        }

        if (request.cursor != null) {
            void loadPage({ ...request, cursor: null }, "push", false, true);
        }
    };

    const handleFirstPage = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setPreviousRequests([]);
        void loadPage({ ...request, cursor: null }, "push", false, true);
    };

    const handleHostClick = (hostId: number) => {
        setPreviousRequests([]);
        void loadPage({
            cursor: null,
            field: "CREATED_AT",
            hostId,
            searchKeyword: "",
            statusGroup: "ACTIVE",
            types: [],
        });
    };

    const statusLabel = statusOptions.find((option) => option.value === request.statusGroup)?.label ?? "예정/진행";
    const hostName = request.hostId == null
        ? null
        : hostOptions.find((host) => host.id === request.hostId)?.name ?? "선택한 주최";
    const nextCursor = events?.pageInfo.hasNext ? events.pageInfo.nextCursor : null;
    const canGoPrevious = previousRequests.length > 0 || request.cursor != null;

    return (
        <div ref={pageTopRef} className="scroll-mt-24">
            {!isListView ? (
                <EventsDiscovery
                    categoryExplore={categoryExplore}
                    events={initialIsListView ? (events?.content ?? []) : initialData.content}
                    onExplore={handleExplore}
                />
            ) : (
                <div data-events-view="list" className="events-list-enter">
                    <header className="mb-6 text-center">
                        <h1 tabIndex={-1} className="text-3xl font-bold outline-none">행사 목록</h1>
                        <p className="mt-3 text-muted-foreground">관심 분야와 일정에 맞는 행사만 골라 확인해보세요.</p>
                    </header>
                    <section className="mb-8">
                        <EventFiltersForm
                            field={request.field}
                            hostId={request.hostId}
                            hostOptions={hostOptions}
                            hostsLoadError={hostsLoadError}
                            isHostsLoading={isHostsLoading}
                            isLoading={isLoading}
                            onFiltersChange={handleFiltersChange}
                            onReset={handleReset}
                            searchKeyword={request.searchKeyword}
                            sortOptions={sortOptions}
                            statusGroup={request.statusGroup}
                            statusOptions={statusOptions}
                            typeOptions={typeOptions}
                            types={request.types}
                        />
                    </section>

                    <section ref={eventListRef} className="scroll-mt-24">
                        {isLoading ? (
                            <EventListScaffold />
                        ) : error != null ? (
                        <div className="rounded-lg border border-destructive/20 bg-background px-6 py-14 text-center" role="alert">
                            <h2 className="text-xl font-bold text-foreground">행사 정보를 불러오지 못했어요</h2>
                            <p className="mt-2 text-muted-foreground">잠시 후 다시 시도해주세요.</p>
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                <button
                                    className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
                                    onClick={() => void loadPage(request, "none", true)}
                                    type="button"
                                >
                                    다시 불러오기
                                </button>
                                {request.cursor != null && (
                                    <Link
                                        className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-semibold text-foreground transition hover:border-subtle-foreground"
                                        href={getEventsHref(request, null)}
                                        onClick={handleFirstPage}
                                    >
                                        첫 페이지로
                                    </Link>
                                )}
                            </div>
                        </div>
                        ) : events != null ? (
                        <>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">
                                    {getSortLabel(request.field)} · {statusLabel}{hostName != null ? ` · 주최: ${hostName}` : ""} · {events.pageInfo.pageSize}개 표시
                                </p>
                                {request.cursor != null && (
                                    <Link className="text-sm font-semibold text-brand underline" href={getEventsHref(request, null)} onClick={handleFirstPage}>
                                        첫 페이지로
                                    </Link>
                                )}
                            </div>

                            {events.content.length > 0 ? (
                                <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {events.content.map((event, index) => (
                                        <li key={event.id} className="h-full">
                                            <EventCard event={event} eager={index < 4} onHostClick={handleHostClick} priority={index === 0} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="rounded-lg border border-dashed border-input bg-background px-6 py-14 text-center">
                                    <h2 className="text-xl font-bold text-foreground">조건에 맞는 행사가 없어요</h2>
                                    <p className="mt-2 text-muted-foreground">검색어를 줄이거나 행사 유형을 다시 선택해보세요.</p>
                                    <Link
                                        className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white"
                                        href="/events?view=list"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            handleReset();
                                        }}
                                    >
                                        전체 행사 보기
                                    </Link>
                                </div>
                            )}

                            <nav aria-label="행사 페이지 탐색" className="mt-8 flex items-center justify-center gap-3">
                                <button
                                    aria-label="이전 행사 페이지"
                                    className={PAGINATION_BUTTON_CLASS}
                                    disabled={!canGoPrevious}
                                    onClick={handlePreviousPage}
                                    type="button"
                                >
                                    <ChevronLeft aria-hidden="true" className="size-4" />
                                    이전
                                </button>
                                <button
                                    aria-label="다음 행사 페이지"
                                    className={PAGINATION_BUTTON_CLASS}
                                    disabled={nextCursor == null}
                                    onClick={handleNextPage}
                                    type="button"
                                >
                                    다음
                                    <ChevronRight aria-hidden="true" className="size-4" />
                                </button>
                            </nav>
                        </>
                        ) : null}
                    </section>
                </div>
            )}
        </div>
    );
}

async function fetchEventsPage(request: EventPageRequest, signal: AbortSignal): Promise<EventResponse> {
    const query = getEventsSearchParams(request, request.cursor).toString();
    const response = await fetch(`/api/events${query ? `?${query}` : ""}`, {
        headers: { Accept: "application/json" },
        signal,
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw new EventsClientFetchError(getErrorMessage(payload), response.status);
    }

    return deserializeEventsResponse(payload);
}

function deserializeEventsResponse(payload: unknown): EventResponse {
    if (!isEventsResponseWire(payload)) {
        throw new EventsClientFetchError("행사 목록 응답 형식이 올바르지 않습니다.", 502);
    }

    return {
        content: payload.content.map((event) => ({
            ...event,
            startAt: toDate(event.startAt),
            endAt: toOptionalDate(event.endAt),
            recruitmentStartAt: toOptionalDate(event.recruitmentStartAt),
            recruitmentEndAt: toOptionalDate(event.recruitmentEndAt),
        })),
        pageInfo: payload.pageInfo,
    };
}

function isEventsResponseWire(value: unknown): value is EventsResponseWire {
    if (!isRecord(value) || !Array.isArray(value.content) || !isRecord(value.pageInfo)) return false;

    return value.content.every((event) => (
        isRecord(event)
        && typeof event.id === "number"
        && typeof event.title === "string"
        && typeof event.startAt === "string"
        && isNullableString(event.endAt)
        && isNullableString(event.recruitmentStartAt)
        && isNullableString(event.recruitmentEndAt)
    ));
}

function toDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new EventsClientFetchError("행사 일정 형식이 올바르지 않습니다.", 502);
    }
    return date;
}

function toOptionalDate(value: string | null): Date | null {
    return value == null ? null : toDate(value);
}

function getErrorMessage(payload: unknown): string {
    if (isRecord(payload) && typeof payload.message === "string" && payload.message.trim()) {
        return payload.message;
    }

    return "행사 목록을 불러올 수 없습니다.";
}

function toClientFetchError(error: unknown): EventsClientFetchError {
    if (error instanceof EventsClientFetchError) return error;
    return new EventsClientFetchError("행사 목록을 불러올 수 없습니다.", 502);
}

function getRequestKey(request: EventPageRequest): string {
    return getEventsSearchParams(request, request.cursor).toString();
}

function getDocumentTitle(request: EventPageRequest): string {
    return request.searchKeyword ? `${request.searchKeyword} 행사 검색 | 듀잇` : "간호 행사 목록 | 듀잇";
}

function getCachedPage(key: string): EventResponse | null {
    const cached = pageCache.get(key);
    if (cached == null) return null;
    if (cached.expiresAt <= Date.now()) {
        pageCache.delete(key);
        return null;
    }

    pageCache.delete(key);
    pageCache.set(key, cached);
    return cached.data;
}

function cachePage(key: string, data: EventResponse) {
    pageCache.delete(key);
    pageCache.set(key, { data, expiresAt: Date.now() + CLIENT_PAGE_CACHE_TTL });

    if (pageCache.size > MAX_CLIENT_PAGE_CACHE_ENTRIES) {
        const oldestKey = pageCache.keys().next().value;
        if (oldestKey != null) pageCache.delete(oldestKey);
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
    return value === null || typeof value === "string";
}

function getHostOptions(value: unknown): HostOption[] | null {
    if (!isRecord(value) || !Array.isArray(value.hosts)) return null;

    const hosts = value.hosts.flatMap((host) => {
        if (!isRecord(host) || typeof host.id !== "number" || typeof host.name !== "string") return [];
        if (!Number.isSafeInteger(host.id) || host.id <= 0 || !host.name.trim()) return [];

        return [{ id: host.id, name: host.name.trim() }];
    });

    return hosts;
}

class EventsClientFetchError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
        this.name = "EventsClientFetchError";
    }
}
