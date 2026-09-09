"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

import { Button } from "@/src/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

export type SelectDropdownOption = {
    value: string;
    label: string;
};

type SelectDropdownProps = {
    className?: string;
    label: string;
    name?: string;
    onValueChange: (value: string) => void;
    options: readonly SelectDropdownOption[];
    value: string;
};

export function SelectDropdown({ className, label, name, onValueChange, options, value }: SelectDropdownProps) {
    const labelId = useId();
    const selectedValueId = useId();
    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className={cn("flex flex-col gap-2 text-sm font-semibold text-foreground", className)}>
            <span id={labelId}>{label}</span>
            {name ? <input type="hidden" name={name} value={value} /> : null}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        aria-labelledby={`${labelId} ${selectedValueId}`}
                        className="h-11 w-full justify-between rounded-lg border-input px-3 text-base font-normal text-foreground hover:border-subtle-foreground hover:bg-muted focus-visible:outline-brand"
                    >
                        <span id={selectedValueId} className="truncate">{selectedOption?.label ?? "선택"}</span>
                        <ChevronDown className="-mr-1 ml-2 size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] border-border bg-background p-1 text-foreground">
                    <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
                        {options.map((option) => (
                            <DropdownMenuRadioItem
                                key={option.value || "all"}
                                value={option.value}
                                className="cursor-pointer rounded-md py-2 pl-8 pr-3 text-sm font-medium focus:bg-muted focus:text-foreground"
                            >
                                {option.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
