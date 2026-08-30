import EventCard from "@/src/components/ui/EventCard";
import {
    EVENT_SORT_FIELDS,
    EventSortField,
    EventsFetchError,
    fetchEvents,
} from "@/src/lib/api/events";
import { EventStatusGroup, EventStatusGroupLabel } from "@/src/lib/schemas/event-status";
import { EventType, EventTypeLabel } from "@/src/lib/schemas/event-type";
import { Search } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

const EVENTS_CANONICAL = "https://www.dutyit.net/events";
const PAGE_SIZE = 12;

type EventsSearchParams = {
    cursor?: string | string[] | null;
    field?: string | string[] | null;
    q?: string | string[] | null;
    searchKeyword?: string | string[] | null;
    statusGroup?: string | string[] | null;
    types?: string | string[] | null;
};

type Props = { searchParams: Promise<EventsSearchParams> };

type EventFilters = {
    field: EventSortField;
    searchKeyword: string;
    statusGroup: EventStatusGroup;
    types: EventType[];
};

const EVENT_TYPE_OPTIONS = [
    "CONFERENCE",
    "SEMINAR",
    "WEBINAR",
    "WORKSHOP",
    "CONTEST",
    "CONTINUING_EDUCATION",
    "EDUCATION",
    "VOLUNTEER",
    "TRAINING",
    "SUPPORTERS",
    "ETC",
] as const satisfies readonly EventType[];

const PUBLIC_STATUS_GROUP_OPTIONS = [
    "ACTIVE",
    "FINISHED",
] as const satisfies readonly EventStatusGroup[];

const SORT_OPTIONS = [
    { value: "CREATED_AT", label: "최신 등록순" },
    { value: "START_DATE", label: "시작 임박순" },
    { value: "RECRUITMENT_DEADLINE", label: "모집 마감순" },
    { value: "VIEW_COUNT", label: "인기순" },
] as const satisfies readonly { value: EventSortField; label: string }[];

const EVENT_SORT_FIELD_SET = new Set<string>(EVENT_SORT_FIELDS);
const EVENT_TYPE_SET = new Set<string>(EVENT_TYPE_OPTIONS);
const PUBLIC_STATUS_GROUP_SET = new Set<string>(PUBLIC_STATUS_GROUP_OPTIONS);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const filters = getEventFilters(await searchParams);
    const title = filters.searchKeyword
        ? `${filters.searchKeyword} 행사 검색 | 듀잇`
        : "간호 행사 목록 | 듀잇";

    return {
        title,
        alternates: {
            canonical: EVENTS_CANONICAL,
        },
        openGraph: {
            url: getEventsAbsoluteUrl(filters),
            title,
        },
    };
}

export default async function EventsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const cursor = getCursor(resolvedSearchParams);
    const filters = getEventFilters(resolvedSearchParams);
    let recoveredFromInvalidCursor = false;

    let events = await fetchEventsSafely(filters, cursor);
    if (events == null) {
        recoveredFromInvalidCursor = true;
        events = await fetchEventsSafely(filters, null);
    }
    if (events == null) {
        throw new Error("Failed to recover events list from invalid cursor.");
    }

    const { content, pageInfo } = events;
    const nextHref = pageInfo.hasNext && pageInfo.nextCursor
        ? getEventsHref(filters, pageInfo.nextCursor)
        : null;
    const hasFilters = hasActiveFilters(filters);

    return (
        <div className="paper-glow min-h-[calc(100vh-73px)]">
            <div className="mx-auto max-w-[1440px] px-5 py-11 sm:px-8 sm:py-14 lg:px-11 lg:py-16">
                <header className="mb-9 max-w-xl">
                    <h1 className="text-4xl font-extrabold tracking-[-0.075em] text-ink sm:text-5xl">행사 목록</h1>
                    <p className="mt-4 text-[16px] leading-7 tracking-[-0.035em] text-muted">
                        간호의 성장과 전문성을 넓혀줄 다양한 행사 정보를 한곳에서 찾아봐요.
                    </p>
                </header>

                <section className="mb-8 rounded-[18px] border border-line bg-surface/85 p-4 shadow-[0_16px_38px_rgba(65,45,31,0.04)] sm:p-5">
                    <form action="/events" className="space-y-5">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
                            <label className="relative block">
                                <span className="sr-only">검색</span>
                                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" strokeWidth={2} aria-hidden="true" />
                                <input
                                    className="h-[52px] w-full rounded-xl border border-line bg-white px-4 pl-12 text-[15px] font-medium text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10"
                                    name="q"
                                    defaultValue={filters.searchKeyword}
                                    placeholder="행사명으로 검색해요"
                                />
                            </label>

                            <label className="block">
                                <span className="sr-only">정렬</span>
                                <select
                                    className="h-[52px] w-full rounded-xl border border-line bg-white px-4 text-[15px] font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                                    name="field"
                                    defaultValue={filters.field}
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="sr-only">상태</span>
                                <select
                                    className="h-[52px] w-full rounded-xl border border-line bg-white px-4 text-[15px] font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                                    name="statusGroup"
                                    defaultValue={filters.statusGroup}
                                >
                                    {PUBLIC_STATUS_GROUP_OPTIONS.map((statusGroup) => (
                                        <option key={statusGroup} value={statusGroup}>
                                            {EventStatusGroupLabel[statusGroup]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <fieldset className="border-t border-line pt-4">
                            <legend className="sr-only">행사 유형</legend>
                            <div className="flex flex-wrap gap-2">
                                {EVENT_TYPE_OPTIONS.map((type) => (
                                    <label key={type} className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            type="checkbox"
                                            name="types"
                                            value={type}
                                            defaultChecked={filters.types.includes(type)}
                                        />
                                        <span className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3 text-sm font-semibold tracking-[-0.035em] text-muted transition hover:border-brand/50 hover:text-brand peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">
                                            {EventTypeLabel[type]}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                            {hasFilters ? (
                                <p className="text-sm tracking-[-0.03em] text-muted">선택한 조건으로 행사를 다시 찾아봐요.</p>
                            ) : <span />}
                            <div className="ml-auto flex gap-2">
                                <Link
                                    className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-ink/30"
                                    href="/events"
                                >
                                    초기화
                                </Link>
                                <button
                                    className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                    type="submit"
                                >
                                    적용
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                {recoveredFromInvalidCursor ? (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                        페이지 정보가 만료되어 첫 페이지를 보여줘요.{" "}
                        <Link className="font-semibold underline" href={getEventsHref(filters, null)}>
                            정리된 주소로 보기
                        </Link>
                    </div>
                ) : null}

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                    <p className="text-sm font-semibold tracking-[-0.035em] text-ink">
                        {getSortLabel(filters.field)} · {EventStatusGroupLabel[filters.statusGroup]} · {pageInfo.pageSize}개 표시
                    </p>
                    {cursor ? (
                        <Link className="text-sm font-semibold text-brand underline underline-offset-4" href={getEventsHref(filters, null)}>
                            첫 페이지로
                        </Link>
                    ) : null}
                </div>

                {content.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {content.map((event, index) => (
                            <li key={event.id}>
                                <EventCard event={event} eager={index < 3} priority={index === 0} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-[18px] border border-dashed border-line bg-surface px-6 py-14 text-center">
                        <h2 className="text-xl font-bold text-ink">조건에 맞는 행사가 없어요</h2>
                        <p className="mt-2 text-muted">검색어를 줄이거나 행사 유형을 다시 골라봐요.</p>
                        <Link
                            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-deep"
                            href="/events"
                        >
                            전체 행사 보기
                        </Link>
                    </div>
                )}

                <nav className="mt-9 flex items-center justify-center gap-3">
                    {nextHref ? (
                        <Link href={nextHref} className="inline-flex h-12 items-center rounded-xl border border-brand bg-surface px-7 text-sm font-bold text-brand transition hover:bg-brand hover:text-white">
                            다음 행사 보기
                        </Link>
                    ) : (
                        <span className="inline-flex h-12 items-center rounded-xl border border-line bg-surface px-7 text-sm font-semibold text-muted/70">
                            마지막 목록입니다
                        </span>
                    )}
                </nav>
            </div>
        </div>
    );
}

async function fetchEventsSafely(filters: EventFilters, cursor: string | null): Promise<Awaited<ReturnType<typeof fetchEvents>> | null> {
    try {
        return await fetchEvents({
            cursor,
            field: filters.field,
            searchKeyword: filters.searchKeyword,
            size: PAGE_SIZE,
            statusGroup: filters.statusGroup,
            types: filters.types,
        });
    } catch (error) {
        if (cursor != null && error instanceof EventsFetchError && error.status === 400) {
            return null;
        }
        throw error;
    }
}

function getEventFilters(searchParams: EventsSearchParams): EventFilters {
    return {
        field: getEventSortField(searchParams),
        searchKeyword: getSearchKeyword(searchParams),
        statusGroup: getStatusGroup(searchParams),
        types: getEventTypes(searchParams),
    };
}

function getCursor(searchParams: EventsSearchParams): string | null {
    return getFirstValue(searchParams.cursor);
}

function getEventSortField(searchParams: EventsSearchParams): EventSortField {
    const field = getFirstValue(searchParams.field);
    return field != null && EVENT_SORT_FIELD_SET.has(field) ? field as EventSortField : "CREATED_AT";
}

function getSearchKeyword(searchParams: EventsSearchParams): string {
    const keyword = getFirstValue(searchParams.q) ?? getFirstValue(searchParams.searchKeyword) ?? "";
    return keyword.trim().slice(0, 80);
}

function getStatusGroup(searchParams: EventsSearchParams): EventStatusGroup {
    const statusGroup = getFirstValue(searchParams.statusGroup);
    return statusGroup != null && PUBLIC_STATUS_GROUP_SET.has(statusGroup)
        ? statusGroup as EventStatusGroup
        : "ACTIVE";
}

function getEventTypes(searchParams: EventsSearchParams): EventType[] {
    const values = getValues(searchParams.types)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter((value) => EVENT_TYPE_SET.has(value)) as EventType[];
    const selected = new Set(values);
    return EVENT_TYPE_OPTIONS.filter((type) => selected.has(type));
}

function getFirstValue(value: string | string[] | null | undefined): string | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
}

function getValues(value: string | string[] | null | undefined): string[] {
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
}

function hasActiveFilters(filters: EventFilters): boolean {
    return filters.field !== "CREATED_AT"
        || filters.searchKeyword !== ""
        || filters.statusGroup !== "ACTIVE"
        || filters.types.length > 0;
}

function getSortLabel(field: EventSortField): string {
    return SORT_OPTIONS.find((option) => option.value === field)?.label ?? "최신 등록순";
}

function getEventsHref(filters: EventFilters, cursor: string | null): string {
    const params = getEventsSearchParams(filters, cursor);
    const query = params.toString();
    return query ? `/events?${query}` : "/events";
}

function getEventsAbsoluteUrl(filters: EventFilters): string {
    const url = new URL(EVENTS_CANONICAL);
    const params = getEventsSearchParams(filters, null);
    params.forEach((value, key) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}

function getEventsSearchParams(filters: EventFilters, cursor: string | null): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.field !== "CREATED_AT") params.set("field", filters.field);
    if (filters.searchKeyword !== "") params.set("q", filters.searchKeyword);
    if (filters.statusGroup !== "ACTIVE") params.set("statusGroup", filters.statusGroup);
    if (filters.types.length > 0) params.set("types", filters.types.join(","));
    if (cursor != null) params.set("cursor", cursor);
    return params;
}
