import { Suspense } from "react";

import CategoryExploreCard, { type CategoryExploreImage } from "@/src/components/ui/CategoryExploreCard";
import { fetchEvents } from "@/src/lib/api/events";
import type { Event } from "@/src/lib/schemas/event";
import type { EventType } from "@/src/lib/schemas/event-type";

type EventCategory = {
    actionLabel: string;
    description: string;
    eventType: EventType;
    href: string;
    id: "volunteer" | "supporters" | "conference";
    title: string;
};

const CATEGORY_IMAGE_LIMIT = 3;
const EVENT_IMAGE_FALLBACK = "/event-thumbnail-placeholder.svg";

const EVENT_CATEGORIES = [
    {
        id: "volunteer",
        title: "봉사",
        description: "현장에서 함께하는 간호 활동",
        actionLabel: "행사 보기",
        href: "/events?types=VOLUNTEER",
        eventType: "VOLUNTEER",
    },
    {
        id: "supporters",
        title: "서포터즈",
        description: "간호의 가치를 알리는 경험",
        actionLabel: "행사 보기",
        href: "/events?types=SUPPORTERS",
        eventType: "SUPPORTERS",
    },
    {
        id: "conference",
        title: "학술대회",
        description: "새로운 지식을 나누는 자리",
        actionLabel: "행사 보기",
        href: "/events?types=CONFERENCE",
        eventType: "CONFERENCE",
    },
] as const satisfies readonly EventCategory[];

const JOB_CATEGORY = {
    title: "채용",
    actionLabel: "채용 보기",
    href: "/jobs",
    images: [{
        src: "/images/home/category-jobs.webp",
        title: "나에게 맞는 간호 일자리",
    }],
} as const;

export default function EventCategoryExplore() {
    return (
        <Suspense fallback={<EventCategoryExploreLoading />}>
            <EventCategoryExploreContent />
        </Suspense>
    );
}

async function EventCategoryExploreContent() {
    const categories = await loadEventCategories();

    return (
        <section id="category-explore" aria-labelledby="event-category-explore-title" className="py-2 sm:py-4">
            <header className="max-w-2xl">
                <h2 id="event-category-explore-title" className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    관심 분야별로 둘러보기
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
                    내게 맞는 간호 활동과 다음 기회를 찾아보세요.
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4">
                {categories.map((category) => (
                    <CategoryExploreCard
                        key={category.id}
                        actionLabel={category.actionLabel}
                        href={category.href}
                        images={category.images}
                        title={category.title}
                    />
                ))}
                <CategoryExploreCard {...JOB_CATEGORY} />
            </div>
        </section>
    );
}

async function loadEventCategories() {
    return Promise.all(EVENT_CATEGORIES.map(async (category) => {
        try {
            const { content } = await fetchEvents({
                field: "CREATED_AT",
                size: 12,
                statusGroup: "FINISHED",
                types: [category.eventType],
            });

            return {
                ...category,
                images: getEventImages(content, category.description),
            };
        } catch (error) {
            console.error("Failed to load event category content", {
                category: category.id,
                error: getSafeErrorLog(error),
            });

            return {
                ...category,
                images: [{
                    src: EVENT_IMAGE_FALLBACK,
                    title: category.description,
                }],
            };
        }
    }));
}

function getEventImages(events: readonly Event[], fallbackTitle: string): CategoryExploreImage[] {
    const imageUrls = new Set<string>();
    const images: CategoryExploreImage[] = [];

    for (const event of events) {
        const imageUrl = event.thumbnail?.trim();
        if (!isAllowedEventThumbnail(imageUrl) || imageUrls.has(imageUrl)) continue;

        imageUrls.add(imageUrl);
        images.push({
            src: imageUrl,
            title: event.title.trim() || fallbackTitle,
        });

        if (images.length === CATEGORY_IMAGE_LIMIT) break;
    }

    return images.length > 0
        ? images
        : [{ src: EVENT_IMAGE_FALLBACK, title: fallbackTitle }];
}

function isAllowedEventThumbnail(imageUrl: string | undefined): imageUrl is string {
    if (!imageUrl) return false;

    try {
        const url = new URL(imageUrl);
        return url.protocol === "https:" && url.hostname === "api.dutyit.net" && url.pathname.startsWith("/uploads/");
    } catch {
        return false;
    }
}

function EventCategoryExploreLoading() {
    return (
        <section id="category-explore" aria-busy="true" aria-labelledby="event-category-explore-loading-title" className="py-2 sm:py-4">
            <header className="max-w-2xl">
                <h2 id="event-category-explore-loading-title" className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    관심 분야별로 둘러보기
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
                    내게 맞는 간호 활동과 다음 기회를 찾아보세요.
                </p>
            </header>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4" aria-hidden>
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="min-h-[22rem] animate-pulse rounded-[1.5rem] bg-slate-200 sm:min-h-[25rem] xl:min-h-[28rem]" />
                ))}
            </div>
        </section>
    );
}

function getSafeErrorLog(error: unknown) {
    if (error instanceof Error) {
        return { name: error.name, message: error.message };
    }

    return { type: typeof error };
}
