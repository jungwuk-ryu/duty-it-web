import type { EventStatusGroup } from "@/src/lib/schemas/event-status";
import type { EventType } from "@/src/lib/schemas/event-type";

export const EVENT_SORT_FIELDS = [
    "CREATED_AT",
    "START_DATE",
    "RECRUITMENT_DEADLINE",
    "VIEW_COUNT",
] as const;

export type EventSortField = typeof EVENT_SORT_FIELDS[number];

export type EventFilters = {
    field: EventSortField;
    hostId: number | null;
    searchKeyword: string;
    statusGroup: EventStatusGroup;
    types: EventType[];
};

export type EventPageRequest = EventFilters & {
    cursor: string | null;
};

export type EventSearchParams = {
    cursor?: string | string[] | null;
    field?: string | string[] | null;
    q?: string | string[] | null;
    searchKeyword?: string | string[] | null;
    statusGroup?: string | string[] | null;
    types?: string | string[] | null;
    hostId?: string | string[] | null;
};

export const EVENT_TYPE_OPTIONS = [
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

export const PUBLIC_STATUS_GROUP_OPTIONS = [
    "ACTIVE",
    "FINISHED",
] as const satisfies readonly EventStatusGroup[];

export const SORT_OPTIONS = [
    { value: "CREATED_AT", label: "최신 등록순" },
    { value: "START_DATE", label: "시작 임박순" },
    { value: "RECRUITMENT_DEADLINE", label: "모집 마감순" },
    { value: "VIEW_COUNT", label: "인기순" },
] as const satisfies readonly { value: EventSortField; label: string }[];

const EVENT_SORT_FIELD_SET = new Set<string>(EVENT_SORT_FIELDS);
const EVENT_TYPE_SET = new Set<string>(EVENT_TYPE_OPTIONS);
const PUBLIC_STATUS_GROUP_SET = new Set<string>(PUBLIC_STATUS_GROUP_OPTIONS);

export function getEventFilters(searchParams: EventSearchParams): EventFilters {
    return {
        field: getEventSortField(searchParams),
        hostId: getHostId(searchParams),
        searchKeyword: getSearchKeyword(searchParams),
        statusGroup: getStatusGroup(searchParams),
        types: getEventTypes(searchParams),
    };
}

export function getEventPageRequest(searchParams: EventSearchParams): EventPageRequest {
    return {
        ...getEventFilters(searchParams),
        cursor: getCursor(searchParams),
    };
}

export function getEventPageRequestFromUrlSearchParams(searchParams: URLSearchParams): EventPageRequest {
    const params: EventSearchParams = {};

    for (const key of ["cursor", "field", "q", "searchKeyword", "statusGroup", "types", "hostId"] as const) {
        const values = searchParams.getAll(key);
        if (values.length === 1) {
            params[key] = values[0];
        } else if (values.length > 1) {
            params[key] = values;
        }
    }

    return getEventPageRequest(params);
}

export function getCursor(searchParams: EventSearchParams): string | null {
    const cursor = getFirstValue(searchParams.cursor)?.trim();
    return cursor ? cursor.slice(0, 512) : null;
}

export function getSortLabel(field: EventSortField): string {
    return SORT_OPTIONS.find((option) => option.value === field)?.label ?? "최신 등록순";
}

export function getEventsHref(filters: EventFilters, cursor: string | null): string {
    const query = getEventsSearchParams(filters, cursor).toString();
    return query ? `/events?${query}` : "/events";
}

export function getEventsSearchParams(filters: EventFilters, cursor: string | null): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.field !== "CREATED_AT") params.set("field", filters.field);
    if (filters.searchKeyword !== "") params.set("q", filters.searchKeyword);
    if (filters.statusGroup !== "ACTIVE") params.set("statusGroup", filters.statusGroup);
    if (filters.types.length > 0) params.set("types", filters.types.join(","));
    if (filters.hostId != null) params.set("hostId", `${filters.hostId}`);
    if (cursor != null) params.set("cursor", cursor);
    return params;
}

function getEventSortField(searchParams: EventSearchParams): EventSortField {
    const field = getFirstValue(searchParams.field);
    return field != null && EVENT_SORT_FIELD_SET.has(field) ? field as EventSortField : "CREATED_AT";
}

function getSearchKeyword(searchParams: EventSearchParams): string {
    const keyword = getFirstValue(searchParams.q) ?? getFirstValue(searchParams.searchKeyword) ?? "";
    return keyword.trim().slice(0, 80);
}

function getHostId(searchParams: EventSearchParams): number | null {
    const hostId = getFirstValue(searchParams.hostId)?.trim();
    if (hostId == null || !/^[1-9]\d{0,15}$/.test(hostId)) return null;

    const parsedHostId = Number(hostId);
    return Number.isSafeInteger(parsedHostId) ? parsedHostId : null;
}

function getStatusGroup(searchParams: EventSearchParams): EventStatusGroup {
    const statusGroup = getFirstValue(searchParams.statusGroup);
    return statusGroup != null && PUBLIC_STATUS_GROUP_SET.has(statusGroup)
        ? statusGroup as EventStatusGroup
        : "ACTIVE";
}

function getEventTypes(searchParams: EventSearchParams): EventType[] {
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
