"use client";

import EventCard from "@/src/components/ui/EventCard";
import EventSearch from "@/src/components/ui/EventSearch";
import { getEventPageRequestFromUrlSearchParams, type EventPageRequest } from "@/src/lib/event-query";
import type { Event } from "@/src/lib/schemas/event";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, type ReactNode, useState } from "react";

type Props = {
    categoryExplore: ReactNode;
    events: readonly Event[];
    onExplore: (request: EventPageRequest) => void;
};

export default function EventsDiscovery({ categoryExplore, events, onExplore }: Props) {
    const [searchKeyword, setSearchKeyword] = useState("");

    const openList = (query = new URLSearchParams()) => {
        onExplore(getEventPageRequestFromUrlSearchParams(query));
    };

    const handleCategoryClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest("a") : null;
        if (link == null || (link.target && link.target !== "_self")) return;
        const url = new URL(link.href);
        if (url.origin !== window.location.origin || url.pathname !== "/events") return;
        event.preventDefault();
        openList(url.searchParams);
    };

    return (
        <div className="flex flex-col gap-12 pb-8 sm:gap-16" data-events-view="explore">
            <section className="flex flex-col items-center gap-7 py-6 text-center sm:gap-9 sm:py-10" aria-labelledby="events-heading">
                <header className="flex flex-col gap-3">
                    <h1 id="events-heading" tabIndex={-1} className="text-balance text-3xl font-bold tracking-tight text-foreground outline-none sm:text-5xl sm:leading-tight">
                        나의 다음 <span className="text-brand">간호 경험</span>을 찾아보세요
                    </h1>
                    <p className="text-sm leading-7 text-muted-foreground sm:text-base">배움부터 새로운 도전까지, 나에게 맞는 행사를 한곳에서.</p>
                </header>
                <EventSearch
                    hero
                    value={searchKeyword}
                    onChange={setSearchKeyword}
                    onSearch={(keyword) => openList(new URLSearchParams({ q: keyword }))}
                />
            </section>

            <div onClickCapture={handleCategoryClick}>{categoryExplore}</div>

            <section aria-labelledby="events-preview-title">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h2 id="events-preview-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">새로 올라온 행사</h2>
                        <p className="text-sm text-muted-foreground">지금 참여할 수 있는 기회를 만나보세요.</p>
                    </div>
                    <Link
                        href="/events?view=list"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg py-2 text-sm font-semibold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                        onClick={(event) => {
                            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                            event.preventDefault();
                            openList();
                        }}
                    >
                        전체보기 <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </header>
                {events.length > 0 ? (
                    <ul className="events-preview-grid grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {events.slice(0, 4).map((event) => (
                            <li key={event.id} className="h-full">
                                <EventCard
                                    event={event}
                                    onHostClick={(hostId) => openList(new URLSearchParams({ hostId: String(hostId) }))}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-8 text-center text-muted-foreground">새로운 행사를 준비하고 있어요. 관심 분야에서 더 많은 행사를 찾아보세요.</p>
                )}
            </section>
        </div>
    );
}
