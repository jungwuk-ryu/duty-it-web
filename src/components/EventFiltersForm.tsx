"use client";

import { Button } from "@/src/components/ui/button";
import EventSearch from "@/src/components/ui/EventSearch";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import type { EventFilters, EventSortField, EventStatusFilter } from "@/src/lib/event-query";
import type { EventType } from "@/src/lib/schemas/event-type";
import { SearchField, useFilter } from "@heroui/react";
import { ChevronDown, ListFilter, X } from "lucide-react";
import { type ReactNode, useState } from "react";

type Option<T extends string> = { value: T; label: string };

type Props = {
    field: EventSortField;
    hostId: number | null;
    hostOptions: readonly HostOption[];
    hostsLoadError?: boolean;
    isHostsLoading?: boolean;
    isLoading?: boolean;
    onFiltersChange?: (filters: EventFilters, historyMode?: "push" | "replace") => void;
    onReset?: () => void;
    searchKeyword: string;
    sortOptions: readonly Option<EventSortField>[];
    statusGroup: EventStatusFilter;
    statusOptions: readonly Option<EventStatusFilter>[];
    typeOptions: readonly Option<EventType>[];
    types: EventType[];
};

type HostOption = {
    id: number;
    name: string;
};

export default function EventFiltersForm({
    field,
    hostId,
    hostOptions,
    hostsLoadError = false,
    isHostsLoading = false,
    isLoading = false,
    onFiltersChange,
    onReset,
    searchKeyword,
    sortOptions,
    statusGroup,
    statusOptions,
    typeOptions,
    types,
}: Props) {
    const selectedHost = hostId == null
        ? null
        : hostOptions.find((host) => host.id === hostId) ?? { id: hostId, name: "선택한 주최" };
    const selectedSort = sortOptions.find((option) => option.value === field);
    const selectedStatus = statusOptions.find((option) => option.value === statusGroup);
    const hasFilters = searchKeyword !== ""
        || hostId != null
        || field !== "CREATED_AT"
        || statusGroup !== "ACTIVE"
        || types.length > 0;

    const updateFilters = (nextFilters: Partial<EventFilters>, historyMode: "push" | "replace" = "push") => {
        onFiltersChange?.({
            field,
            hostId,
            searchKeyword,
            statusGroup,
            types,
            ...nextFilters,
        }, historyMode);
    };

    const toggleType = (type: EventType) => {
        updateFilters({
            types: types.includes(type)
                ? types.filter((currentType) => currentType !== type)
                : [...types, type],
        });
    };

    return (
        <section className="space-y-3" aria-busy={isLoading || undefined}>
            <EventSearch
                value={searchKeyword}
                onChange={(value) => updateFilters({ searchKeyword: normalizeSearchKeyword(value) }, "replace")}
            />

            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
                <FilterMenu
                    hostId={hostId}
                    hostOptions={hostOptions}
                    isHostsLoading={isHostsLoading}
                    selectedField={field}
                    selectedStatusGroup={statusGroup}
                    selectedTypes={types}
                    setHostId={(nextHostId) => updateFilters({ hostId: nextHostId })}
                    setSelectedField={(nextField) => updateFilters({ field: nextField })}
                    setSelectedStatusGroup={(nextStatusGroup) => updateFilters({ statusGroup: nextStatusGroup })}
                    sortOptions={sortOptions}
                    statusOptions={statusOptions}
                    toggleType={toggleType}
                    typeOptions={typeOptions}
                />

                {selectedHost != null && (
                    <FilterChip label="주최" onRemove={() => updateFilters({ hostId: null })}>
                        {selectedHost.name}
                    </FilterChip>
                )}
                {field !== "CREATED_AT" && selectedSort != null && (
                    <FilterChip label="정렬" onRemove={() => updateFilters({ field: "CREATED_AT" })}>
                        {selectedSort.label}
                    </FilterChip>
                )}
                {statusGroup !== "ACTIVE" && selectedStatus != null && (
                    <FilterChip label="상태" onRemove={() => updateFilters({ statusGroup: "ACTIVE" })}>
                        {selectedStatus.label}
                    </FilterChip>
                )}
                {types.map((type) => (
                    <FilterChip key={type} label="유형" onRemove={() => toggleType(type)}>
                        {typeOptions.find((option) => option.value === type)?.label ?? type}
                    </FilterChip>
                ))}

                {hasFilters && (
                    <button
                        className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                        onClick={onReset}
                        type="button"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                        초기화
                    </button>
                )}
            </div>

            {hostsLoadError && (
                <p className="text-xs text-amber-700" role="status">
                    주최 기관 목록을 불러오지 못했어요. 카드의 주최 링크는 계속 사용할 수 있어요.
                </p>
            )}
        </section>
    );
}

type HostSearchMenuProps = {
    hostId: number | null;
    hostOptions: readonly HostOption[];
    isHostsLoading: boolean;
    onHostIdChange: (hostId: number | null) => void;
};

function HostSearchMenu({
    hostId,
    hostOptions,
    isHostsLoading,
    onHostIdChange,
}: HostSearchMenuProps) {
    const [searchKeyword, setSearchKeyword] = useState("");
    const { contains } = useFilter({ sensitivity: "base" });
    const matchingHosts = hostOptions.filter((host) => contains(host.name, searchKeyword));

    return (
        <div className="space-y-2">
            <SearchField autoFocus name="host-search" variant="secondary">
                <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input
                        onChange={(event) => setSearchKeyword(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="주최 기관 검색"
                    />
                    <SearchField.ClearButton />
                </SearchField.Group>
            </SearchField>
            {isHostsLoading ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">주최 기관을 불러오는 중…</p>
            ) : matchingHosts.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">검색 결과가 없어요</p>
            ) : (
                <DropdownMenuRadioGroup
                    className="max-h-72 overflow-y-auto"
                    value={hostId == null ? "" : String(hostId)}
                    onValueChange={(value) => onHostIdChange(getHostId(value))}
                >
                    <DropdownMenuRadioItem value="" className="cursor-pointer rounded-md py-2 pl-8 text-sm focus:bg-muted">
                        전체 주최
                    </DropdownMenuRadioItem>
                    {matchingHosts.map((host) => (
                        <DropdownMenuRadioItem key={host.id} value={String(host.id)} className="cursor-pointer rounded-md py-2 pl-8 text-sm focus:bg-muted">
                            {host.name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            )}
        </div>
    );
}

type FilterMenuProps = {
    hostId: number | null;
    hostOptions: readonly HostOption[];
    isHostsLoading: boolean;
    selectedField: EventSortField;
    selectedStatusGroup: EventStatusFilter;
    selectedTypes: EventType[];
    setHostId: (hostId: number | null) => void;
    setSelectedField: (field: EventSortField) => void;
    setSelectedStatusGroup: (status: EventStatusFilter) => void;
    sortOptions: readonly Option<EventSortField>[];
    statusOptions: readonly Option<EventStatusFilter>[];
    toggleType: (type: EventType) => void;
    typeOptions: readonly Option<EventType>[];
};

function FilterMenu({
    hostId,
    hostOptions,
    isHostsLoading,
    selectedField,
    selectedStatusGroup,
    selectedTypes,
    setHostId,
    setSelectedField,
    setSelectedStatusGroup,
    sortOptions,
    statusOptions,
    toggleType,
    typeOptions,
}: FilterMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="h-8 gap-1.5 rounded-lg border-input px-3 text-foreground hover:border-subtle-foreground hover:bg-canvas">
                    <ListFilter className="size-4" aria-hidden="true" />
                    필터 추가
                    <ChevronDown className="size-3.5 text-subtle-foreground" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 border-border bg-background p-1.5 text-foreground">
                <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-muted-foreground">필터 선택</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-muted" />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md py-2 text-sm font-medium focus:bg-muted data-[state=open]:bg-muted">
                        주최
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-72 border-border bg-background p-2">
                        <HostSearchMenu
                            hostId={hostId}
                            hostOptions={hostOptions}
                            isHostsLoading={isHostsLoading}
                            onHostIdChange={setHostId}
                        />
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md py-2 text-sm font-medium focus:bg-muted data-[state=open]:bg-muted">
                        정렬
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44 border-border bg-background p-1.5">
                        <DropdownMenuRadioGroup value={selectedField} onValueChange={(value) => setSelectedField(value as EventSortField)}>
                            {sortOptions.map((option) => (
                                <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer rounded-md py-2 pl-8 text-sm focus:bg-muted">
                                    {option.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md py-2 text-sm font-medium focus:bg-muted data-[state=open]:bg-muted">
                        상태
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40 border-border bg-background p-1.5">
                        <DropdownMenuRadioGroup value={selectedStatusGroup} onValueChange={(value) => setSelectedStatusGroup(value as EventStatusFilter)}>
                            {statusOptions.map((option) => (
                                <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer rounded-md py-2 pl-8 text-sm focus:bg-muted">
                                    {option.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md py-2 text-sm font-medium focus:bg-muted data-[state=open]:bg-muted">
                        행사 유형
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-52 border-border bg-background p-1.5">
                        <div className="max-h-72 overflow-y-auto">
                            {typeOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={selectedTypes.includes(option.value)}
                                    className="cursor-pointer rounded-md py-2 pl-8 text-sm focus:bg-muted"
                                    onCheckedChange={() => toggleType(option.value)}
                                    onSelect={(event) => event.preventDefault()}
                                >
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </div>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function FilterChip({ children, label, onRemove }: { children: ReactNode; label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-border bg-canvas py-1 pl-2.5 pr-1 text-sm text-foreground">
            <span className="shrink-0 text-xs font-medium text-subtle-foreground">{label}</span>
            <span className="truncate font-medium">{children}</span>
            <button
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-subtle-foreground transition hover:bg-background hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                onClick={onRemove}
                type="button"
                aria-label={label + " 필터 삭제"}
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </span>
    );
}

function getHostId(value: string): number | null {
    if (!/^[1-9]\d{0,15}$/.test(value)) return null;

    const hostId = Number(value);
    return Number.isSafeInteger(hostId) ? hostId : null;
}

function normalizeSearchKeyword(value: string): string {
    return value.trim().slice(0, 80);
}
