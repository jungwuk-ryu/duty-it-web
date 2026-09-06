"use client";

import EventFiltersForm from "@/src/components/EventFiltersForm";
import EventListScaffold from "@/src/components/EventListScaffold";
import EventCard from "@/src/components/ui/EventCard";
import {
    getEventPageRequestFromUrlSearchParams,
    getEventsHref,
    getEventsSearchParams,
    getSortLabel,
    type EventFilters,
    type EventPageRequest,
    type EventSortField,
} from "@/src/lib/event-query";
import type { Event } from "@/src/lib/schemas/event";
import type { EventResponse } from "@/src/lib/schemas/events-response";
import type { EventStatusGroup } from "@/src/lib/schemas/event-status";
import type { EventType } from "@/src/lib/schemas/event-type";
import Link from "next/link";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

type Option<T extends string> = { value: T; label: string };

type Props = {
    initialData: EventResponse;
    initialRequest: EventPageRequest;
    sortOptions: readonly Option<EventSortField>[];
    statusOptions: readonly Option<EventStatusGroup>[];
    typeOptions: readonly Option<EventType>[];
};

type HistoryMode = "none" | "push";
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

export default function EventsResults({
    initialData,
    initialRequest,
    sortOptions,
    statusOptions,
    typeOptions,
}: Props) {
    const [request, setRequest] = useState<EventPageRequest>(initialRequest);
    const [events, setEvents] = useState<EventResponse | null>(initialData);
    const [error, setError] = useState<EventsClientFetchError | null>(null);
    const [hostOptions, setHostOptions] = useState<HostOption[]>([]);
    const [hostsLoadError, setHostsLoadError] = useState(false);
    const [isHostsLoading, setIsHostsLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const activeRequestKeyRef = useRef(getRequestKey(initialRequest));
    const controllerRef = useRef<AbortController | null>(null);
    const requestVersionRef = useRef(0);

    const loadPage = useCallback(async (nextRequest: EventPageRequest, historyMode: HistoryMode = "push", force = false) => {
        const requestKey = getRequestKey(nextRequest);
        if (!force && requestKey === activeRequestKeyRef.current) return;

        if (historyMode === "push") {
            window.history.pushState(null, "", getEventsHref(nextRequest, nextRequest.cursor));
        }
        document.title = getDocumentTitle(nextRequest);

        activeRequestKeyRef.current = requestKey;
        controllerRef.current?.abort();
        const requestVersion = ++requestVersionRef.current;
        const cached = getCachedPage(requestKey);

        setRequest(nextRequest);
        setError(null);

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
    }, []);

    useEffect(() => {
        cachePage(getRequestKey(initialRequest), initialData);
        return () => controllerRef.current?.abort();
    }, [initialData, initialRequest]);

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            void loadPage(getEventPageRequestFromUrlSearchParams(new URLSearchParams(window.location.search)), "none");
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [loadPage]);

    const handleApply = (filters: EventFilters) => {
        void loadPage({ ...filters, cursor: null });
    };

    const handleReset = () => {
        void loadPage({
            cursor: null,
            field: "CREATED_AT",
            hostId: null,
            searchKeyword: "",
            statusGroup: "ACTIVE",
            types: [],
        });
    };

    const handleNextPage = (event: MouseEvent<HTMLAnchorElement>, nextCursor: string) => {
        event.preventDefault();
        void loadPage({ ...request, cursor: nextCursor });
    };

    const handleFirstPage = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        void loadPage({ ...request, cursor: null });
    };

    const handleHostClick = (hostId: number) => {
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
    const nextHref = events?.pageInfo.hasNext && events.pageInfo.nextCursor
        ? getEventsHref(request, events.pageInfo.nextCursor)
        : null;

    return (
        <>
            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)] md:p-5">
                <EventFiltersForm
                    key={getFiltersKey(request)}
                    field={request.field}
                    hostId={request.hostId}
                    hostOptions={hostOptions}
                    hostsLoadError={hostsLoadError}
                    isHostsLoading={isHostsLoading}
                    isLoading={isLoading}
                    onApply={handleApply}
                    onReset={handleReset}
                    searchKeyword={request.searchKeyword}
                    sortOptions={sortOptions}
                    statusGroup={request.statusGroup}
                    statusOptions={statusOptions}
                    typeOptions={typeOptions}
                    types={request.types}
                />
            </section>

            {isLoading ? (
                <EventListScaffold />
            ) : error != null ? (
                <div className="rounded-lg border border-red-100 bg-white px-6 py-14 text-center" role="alert">
                    <h2 className="text-xl font-bold text-gray-900">행사 정보를 불러오지 못했어요</h2>
                    <p className="mt-2 text-gray-600">잠시 후 다시 시도해주세요.</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <button
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90"
                            onClick={() => void loadPage(request, "none", true)}
                            type="button"
                        >
                            다시 불러오기
                        </button>
                        {request.cursor != null && (
                            <Link
                                className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
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
                        <p className="text-sm text-gray-600">
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
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                            <h2 className="text-xl font-bold text-gray-900">조건에 맞는 행사가 없어요</h2>
                            <p className="mt-2 text-gray-600">검색어를 줄이거나 행사 유형을 다시 선택해보세요.</p>
                            <Link
                                className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white"
                                href="/events"
                                onClick={(event) => {
                                    event.preventDefault();
                                    handleReset();
                                }}
                            >
                                전체 행사 보기
                            </Link>
                        </div>
                    )}

                    <nav className="mt-8 flex items-center justify-center gap-3">
                        {nextHref ? (
                            <Link
                                href={nextHref}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-brand hover:text-brand"
                                onClick={(event) => handleNextPage(event, events.pageInfo.nextCursor!)}
                            >
                                다음 행사 보기
                            </Link>
                        ) : (
                            <span className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-400">
                                마지막 목록입니다
                            </span>
                        )}
                    </nav>
                </>
            ) : null}
        </>
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

function getFiltersKey(request: EventPageRequest): string {
    return getEventsSearchParams(request, null).toString();
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
