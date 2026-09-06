"use client";

import { BorderBeam } from "@/src/components/ui/border-beam-search";
import { Button } from "@/src/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import type { EventFilters, EventSortField } from "@/src/lib/event-query";
import type { EventStatusGroup } from "@/src/lib/schemas/event-status";
import type { EventType } from "@/src/lib/schemas/event-type";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";

type Option<T extends string> = { value: T; label: string };

type Props = {
    field: EventSortField;
    hostId: number | null;
    hostOptions: readonly HostOption[];
    hostsLoadError?: boolean;
    isHostsLoading?: boolean;
    isLoading?: boolean;
    onApply?: (filters: EventFilters) => void;
    onReset?: () => void;
    searchKeyword: string;
    sortOptions: readonly Option<EventSortField>[];
    statusGroup: EventStatusGroup;
    statusOptions: readonly Option<EventStatusGroup>[];
    typeOptions: readonly Option<EventType>[];
    types: EventType[];
};

export default function EventFiltersForm({
    field,
    hostId,
    hostOptions,
    hostsLoadError = false,
    isHostsLoading = false,
    isLoading = false,
    onApply,
    onReset,
    searchKeyword,
    sortOptions,
    statusGroup,
    statusOptions,
    typeOptions,
    types,
}: Props) {
    const [selectedTypes, setSelectedTypes] = useState<EventType[]>(types);
    const [selectedHostId, setSelectedHostId] = useState(hostId == null ? "" : `${hostId}`);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (onApply == null) return;

        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const nextSearchKeyword = formData.get("q");
        const nextField = formData.get("field");
        const nextHostId = formData.get("hostId");
        const nextStatusGroup = formData.get("statusGroup");

        onApply({
            field: getOptionValue(nextField, sortOptions, field),
            hostId: getHostId(nextHostId),
            searchKeyword: typeof nextSearchKeyword === "string" ? nextSearchKeyword.trim().slice(0, 80) : "",
            statusGroup: getOptionValue(nextStatusGroup, statusOptions, statusGroup),
            types: selectedTypes,
        });
    };

    return (
        <form action="/events" className="space-y-5" onSubmit={handleSubmit} aria-busy={isLoading || undefined}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_180px_180px]">
                <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                    검색
                    <BorderBeam size="line" colorVariant="sunset" theme="light" duration={3.1} borderRadius={12} strength={0.65}>
                        <span className="flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-gray-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                            <Search aria-hidden="true" className="size-5 shrink-0 text-gray-400" strokeWidth={2} />
                            <input className="min-w-0 flex-1 bg-transparent text-base font-normal text-gray-900 outline-none placeholder:text-gray-400" name="q" defaultValue={searchKeyword} placeholder="행사명으로 검색" />
                        </span>
                    </BorderBeam>
                </label>

                <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-gray-700">
                    주최
                    <select
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base font-normal text-gray-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-wait disabled:bg-gray-50 disabled:text-gray-500"
                        value={selectedHostId}
                        disabled={isHostsLoading && hostId == null}
                        name="hostId"
                        onChange={(event) => setSelectedHostId(event.target.value)}
                    >
                        <option value="">{isHostsLoading ? "주최 기관 불러오는 중…" : "전체 주최"}</option>
                        {hostId != null && !hostOptions.some((host) => host.id === hostId) && (
                            <option value={hostId}>선택한 주최</option>
                        )}
                        {hostOptions.map((host) => (
                            <option key={host.id} value={host.id}>{host.name}</option>
                        ))}
                    </select>
                    {hostsLoadError && (
                        <span className="text-xs font-normal text-amber-700">주최 기관 목록을 불러오지 못했어요. 카드의 주최 링크는 계속 사용할 수 있어요.</span>
                    )}
                </label>

                <DropdownField label="정렬" name="field" options={sortOptions} value={field} />
                <DropdownField label="상태" name="statusGroup" options={statusOptions} value={statusGroup} />
            </div>

            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-gray-700">행사 유형</legend>
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map((type) => (
                        <label key={type.value} className="cursor-pointer">
                            <input
                                className="peer sr-only"
                                type="checkbox"
                                name="types"
                                value={type.value}
                                checked={selectedTypes.includes(type.value)}
                                onChange={(event) => {
                                    setSelectedTypes((currentTypes) => event.target.checked
                                        ? [...currentTypes, type.value]
                                        : currentTypes.filter((currentType) => currentType !== type.value));
                                }}
                            />
                            <span className="inline-flex h-9 items-center rounded-full border border-gray-300 px-3 text-sm font-semibold text-gray-600 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-focus-visible:ring-offset-2">
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <div className="flex gap-2">
                    <Link
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                        href="/events"
                        onClick={(event) => {
                            setSelectedTypes([]);
                            if (onReset != null) {
                                event.preventDefault();
                                onReset();
                            }
                        }}
                    >
                        초기화
                    </Link>
                    <button className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-wait disabled:opacity-70" disabled={isLoading} type="submit" aria-busy={isLoading || undefined}>
                        적용
                    </button>
                </div>
            </div>
        </form>
    );
}

type HostOption = {
    id: number;
    name: string;
};

function getOptionValue<T extends string>(value: FormDataEntryValue | null, options: readonly Option<T>[], fallback: T): T {
    if (typeof value !== "string") return fallback;
    return options.some((option) => option.value === value) ? value as T : fallback;
}

function getHostId(value: FormDataEntryValue | null): number | null {
    if (typeof value !== "string" || !/^[1-9]\d{0,15}$/.test(value)) return null;

    const hostId = Number(value);
    return Number.isSafeInteger(hostId) ? hostId : null;
}

function DropdownField<T extends string>({ label, name, options, value }: { label: string; name: string; options: readonly Option<T>[]; value: T }) {
    const [selectedValue, setSelectedValue] = useState<T>(value);
    const labelId = useId();
    const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

    return (
        <div className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            <span id={labelId}>{label}</span>
            <input type="hidden" name={name} value={selectedValue} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" aria-labelledby={labelId} className="h-11 w-full justify-between rounded-lg border-gray-300 px-3 text-base font-normal text-gray-900 hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-brand">
                        {selectedOption.label}
                        <ChevronDown className="-mr-1 ml-2 size-4 text-gray-500" strokeWidth={2} aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] border-gray-200 bg-white p-1 text-gray-900">
                    <DropdownMenuRadioGroup value={selectedValue} onValueChange={(nextValue) => setSelectedValue(nextValue as T)}>
                        {options.map((option) => (
                            <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer rounded-md py-2 pl-8 pr-3 text-sm font-medium focus:bg-gray-100 focus:text-gray-900">
                                {option.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
