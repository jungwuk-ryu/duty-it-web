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
import type { EventSortField } from "@/src/lib/api/events";
import type { EventStatusGroup } from "@/src/lib/schemas/event-status";
import type { EventType } from "@/src/lib/schemas/event-type";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

type Option<T extends string> = { value: T; label: string };

type Props = {
    field: EventSortField;
    hasFilters: boolean;
    searchKeyword: string;
    sortOptions: readonly Option<EventSortField>[];
    statusGroup: EventStatusGroup;
    statusOptions: readonly Option<EventStatusGroup>[];
    typeOptions: readonly Option<EventType>[];
    types: EventType[];
};

export default function EventFiltersForm({
    field,
    hasFilters,
    searchKeyword,
    sortOptions,
    statusGroup,
    statusOptions,
    typeOptions,
    types,
}: Props) {
    return (
        <form action="/events" className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                    검색
                    <BorderBeam size="line" colorVariant="sunset" theme="light" duration={3.1} borderRadius={12} strength={0.65}>
                        <span className="flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-gray-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                            <Search aria-hidden="true" className="size-5 shrink-0 text-gray-400" strokeWidth={2} />
                            <input className="min-w-0 flex-1 bg-transparent text-base font-normal text-gray-900 outline-none placeholder:text-gray-400" name="q" defaultValue={searchKeyword} placeholder="행사명으로 검색" />
                        </span>
                    </BorderBeam>
                </label>

                <DropdownField label="정렬" name="field" options={sortOptions} value={field} />
                <DropdownField label="상태" name="statusGroup" options={statusOptions} value={statusGroup} />
            </div>

            <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-gray-700">행사 유형</legend>
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map((type) => (
                        <label key={type.value} className="cursor-pointer">
                            <input className="peer sr-only" type="checkbox" name="types" value={type.value} defaultChecked={types.includes(type.value)} />
                            <span className="inline-flex h-9 items-center rounded-full border border-gray-300 px-3 text-sm font-semibold text-gray-600 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-focus-visible:ring-offset-2">
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                {hasFilters ? <p className="text-sm text-gray-500">선택한 조건으로 목록을 다시 불러옵니다.</p> : null}
                <div className="ml-auto flex gap-2">
                    <Link className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400" href="/events">
                        초기화
                    </Link>
                    <button className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90" type="submit">
                        적용
                    </button>
                </div>
            </div>
        </form>
    );
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
