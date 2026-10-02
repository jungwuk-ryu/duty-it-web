"use client";

import { cn } from "@/src/lib/utils";
import { ArrowRight, Search, X } from "lucide-react";

type Props = {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (value: string) => void;
    hero?: boolean;
};

export default function EventSearch({ value, onChange, onSearch, hero = false }: Props) {
    const hasKeyword = value.trim().length > 0;
    return (
        <form
            action="/events"
            className={cn("event-search-transition w-full", hero && "mx-auto max-w-2xl")}
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                onSearch?.(value.trim());
            }}
        >
            <label className="sr-only" htmlFor="event-search">행사 검색</label>
            <div className={cn(
                "flex w-full items-center gap-2 border border-input bg-background px-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15",
                hero ? "h-14 rounded-full sm:h-16 sm:px-5" : "h-12 rounded-xl",
            )}>
                <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                <input
                    id="event-search"
                    className="min-w-0 flex-1 bg-transparent px-1 text-base text-accent-foreground outline-none placeholder:text-muted-foreground sm:px-2"
                    name="q"
                    type="search"
                    autoComplete="off"
                    maxLength={80}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) {
                            event.preventDefault();
                        }
                    }}
                    placeholder="행사명 또는 주최로 검색"
                    value={value}
                />
                {value !== "" && (
                    <button
                        aria-label="검색어 지우기"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                        onClick={() => onChange("")}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                )}
                {hero && (
                    <button
                        aria-label="행사 검색하기"
                        className={cn(
                            "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:size-10",
                            hasKeyword ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-gray-400 hover:text-muted-foreground",
                        )}
                        type="submit"
                    >
                        <ArrowRight aria-hidden="true" className="size-5" />
                    </button>
                )}
            </div>
        </form>
    );
}
