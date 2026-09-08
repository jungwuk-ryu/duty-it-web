"use client";

import { BorderBeam } from "@/src/components/ui/border-beam-search";
import { cn } from "@/src/lib/utils";
import { ArrowRight, Search, X } from "lucide-react";

type Props = {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (value: string) => void;
    hero?: boolean;
};

export default function EventSearch({ value, onChange, onSearch, hero = false }: Props) {
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
            <BorderBeam
                className="event-search-beam"
                style={{ display: "block", width: "100%" }}
                size="line"
                colorVariant="colorful"
                duration={3.1}
                borderRadius={hero ? 28 : 12}
                active={hero}
            >
                <div className={cn(
                    "flex w-full items-center gap-2 border border-input bg-background px-3 shadow-sm transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15",
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
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:size-10"
                            type="submit"
                        >
                            <ArrowRight aria-hidden="true" className="size-5" />
                        </button>
                    )}
                </div>
            </BorderBeam>
        </form>
    );
}
