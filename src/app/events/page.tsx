import EventCard from "@/src/components/ui/EventCard";
import {
    EVENT_SORT_FIELDS,
    EventSortField,
    EventsFetchError,
    fetchEvents,
} from "@/src/lib/api/events";
import { EventStatusGroup, EventStatusGroupLabel } from "@/src/lib/schemas/event-status";
import { EventType, EventTypeLabel } from "@/src/lib/schemas/event-type";
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
        <div className="container mx-auto px-4 mb-5 py-10">
            <header className="mb-6 text-center">
                <p className="mb-2 text-sm font-semibold text-brand">간호 행사 탐색</p>
                <h1 className="text-3xl font-bold">행사 목록</h1>
                <p className="mt-3 text-gray-600">
                    관심 분야와 일정에 맞는 행사만 골라 확인해보세요.
                </p>
            </header>

            <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <form action="/events" className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                            검색
                            <input
                                className="h-11 rounded-lg border border-gray-300 px-3 text-base font-normal text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                                name="q"
                                defaultValue={filters.searchKeyword}
                                placeholder="행사명으로 검색"
                            />
                        </label>

                        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                            정렬
                            <select
                                className="h-11 rounded-lg border border-gray-300 px-3 text-base font-normal text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
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

                        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                            상태
                            <select
                                className="h-11 rounded-lg border border-gray-300 px-3 text-base font-normal text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
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

                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-gray-700">행사 유형</legend>
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
                                    <span className="inline-flex h-9 items-center rounded-full border border-gray-300 px-3 text-sm font-semibold text-gray-600 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-focus-visible:ring-offset-2">
                                        {EventTypeLabel[type]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500">
                            {hasFilters ? "선택한 조건으로 목록을 다시 불러옵니다." : "기본값은 예정/진행 행사 최신순입니다."}
                        </p>
                        <div className="flex gap-2">
                            <Link
                                className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                                href="/events"
                            >
                                초기화
                            </Link>
                            <button
                                className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90"
                                type="submit"
                            >
                                적용
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            {recoveredFromInvalidCursor && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                    페이지 정보가 만료되어 첫 페이지를 보여드려요.{" "}
                    <Link className="font-semibold underline" href={getEventsHref(filters, null)}>
                        정리된 주소로 보기
                    </Link>
                </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                    {getSortLabel(filters.field)} · {EventStatusGroupLabel[filters.statusGroup]} · {pageInfo.pageSize}개 표시
                </p>
                {cursor && (
                    <Link className="text-sm font-semibold text-brand underline" href={getEventsHref(filters, null)}>
                        첫 페이지로
                    </Link>
                )}
            </div>

            {content.length > 0 ? (
                <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {content.map((event, index) => (
                        <li key={event.id}>
                            <EventCard event={event} eager={index < 4} priority={index === 0} />
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
                    >
                        전체 행사 보기
                    </Link>
                </div>
            )}

            <nav className="mt-8 flex items-center justify-center gap-3">
                {nextHref ? (
                    <Link href={nextHref} className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-brand hover:text-brand">
                        다음 행사 보기
                    </Link>
                ) : (
                    <span className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-400">
                        마지막 목록입니다
                    </span>
                )}
            </nav>
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
