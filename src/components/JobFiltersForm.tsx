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
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

type Option = { value: string; label: string };

type Props = {
    searchKeyword: string;
    workRegion: string;
    employmentType: string;
    closeType: string;
    workRegionOptions: readonly Option[];
    employmentTypeOptions: readonly Option[];
    closeTypeOptions: readonly Option[];
};

export default function JobFiltersForm({
    searchKeyword,
    workRegion,
    employmentType,
    closeType,
    workRegionOptions,
    employmentTypeOptions,
    closeTypeOptions,
}: Props) {
    return (
        <form action="/jobs" className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px]">
                <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                    검색
                    <BorderBeam size="line" colorVariant="sunset" duration={3.1} borderRadius={12} strength={0.65}>
                        <span className="flex h-11 items-center gap-2 rounded-xl border border-input bg-background px-3 text-muted-foreground shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                            <Search aria-hidden="true" className="size-5 shrink-0 text-subtle-foreground" strokeWidth={2} />
                            <input className="min-w-0 flex-1 bg-transparent text-base font-normal text-foreground outline-none placeholder:text-subtle-foreground" name="q" defaultValue={searchKeyword} placeholder="공고명 또는 기업명으로 검색" />
                        </span>
                    </BorderBeam>
                </label>
                <DropdownField label="근무 지역" name="region" options={workRegionOptions} value={workRegion} />
                <DropdownField label="고용 형태" name="employmentType" options={employmentTypeOptions} value={employmentType} />
                <DropdownField label="마감 방식" name="closeType" options={closeTypeOptions} value={closeType} />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
                <Link className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-semibold text-foreground transition hover:border-subtle-foreground" href="/jobs">
                    초기화
                </Link>
                <Button type="submit" className="h-10 bg-primary px-4 text-white hover:bg-primary/90">
                    적용
                </Button>
            </div>
        </form>
    );
}

function DropdownField({ label, name, options, value }: { label: string; name: string; options: readonly Option[]; value: string }) {
    const [selectedValue, setSelectedValue] = useState(value);
    const labelId = useId();
    const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

    return (
        <div className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            <span id={labelId}>{label}</span>
            <input type="hidden" name={name} value={selectedValue} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" aria-labelledby={labelId} className="h-11 w-full justify-between rounded-lg border-input px-3 text-base font-normal text-foreground hover:border-subtle-foreground hover:bg-canvas focus-visible:outline-brand">
                        {selectedOption.label}
                        <ChevronDown className="-mr-1 ml-2 size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] border-border bg-background p-1 text-foreground">
                    <DropdownMenuRadioGroup value={selectedValue} onValueChange={setSelectedValue}>
                        {options.map((option) => (
                            <DropdownMenuRadioItem key={option.value || "all"} value={option.value} className="cursor-pointer rounded-md py-2 pl-8 pr-3 text-sm font-medium focus:bg-muted focus:text-foreground">
                                {option.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
