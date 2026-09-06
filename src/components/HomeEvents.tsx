import { Suspense } from "react";
import Link from "next/link";
import HomeEventMarquee from "@/src/components/ui/HomeEventMarquee";
import { fetchEvents } from "@/src/lib/api/events";
import { Event } from "@/src/lib/schemas/event";

const HOME_EVENT_LIMIT = 9;

export default function HomeEvents() {
    return (
        <Suspense fallback={<HomeEventsLoading />}>
            <HomeEventsContent />
        </Suspense>
    );
}

async function HomeEventsContent() {
    const events = await loadHomeEvents();

    if (events == null || events.length === 0) return <HomeEventsUnavailable />;

    return <HomeEventsSection events={events} />;
}

function HomeEventsSection({ events }: { events: readonly Event[] }) {
    return (
        <section id="upcoming-events" aria-labelledby="upcoming-events-title" className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)] md:p-9 xl:grid-cols-[minmax(15rem,0.8fr)_minmax(32rem,1.2fr)] xl:gap-12">
            <div className="flex flex-col items-start gap-5">
                <div className="flex flex-col gap-3">
                    <h2 id="upcoming-events-title" className="text-3xl font-bold leading-tight tracking-tight text-slate-950">
                        행사 확인하기
                    </h2>
                    <p className="max-w-sm leading-7 text-slate-600">
                        여러 곳에 흩어진 행사 목록을 한눈에 확인해 보세요.
                    </p>
                </div>
                <Link
                    href="/events?field=START_DATE&statusGroup=ACTIVE"
                    prefetch={false}
                    className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                >
                    전체 행사 보기
                </Link>
            </div>
            <HomeEventMarquee events={events} />
        </section>
    );
}

async function loadHomeEvents(): Promise<Event[] | null> {
    try {
        const { content } = await fetchEvents({
            field: "START_DATE",
            size: HOME_EVENT_LIMIT,
            statusGroup: "ACTIVE",
        });
        return content;
    } catch (error) {
        console.error("Failed to load home events", getSafeErrorLog(error));
        return null;
    }
}

function HomeEventsLoading() {
    return (
        <section aria-labelledby="upcoming-events-loading-title" aria-busy="true" className="flex min-h-72 flex-col justify-center rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
            <h2 id="upcoming-events-loading-title" className="text-2xl font-bold text-slate-950">행사 확인하기</h2>
            <p className="mt-3 text-slate-600">행사 정보를 불러오는 중이에요.</p>
        </section>
    );
}

function HomeEventsUnavailable() {
    return (
        <section aria-labelledby="upcoming-events-unavailable-title" className="flex min-h-72 flex-col justify-center rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
            <h2 id="upcoming-events-unavailable-title" className="text-2xl font-bold text-slate-950">행사 확인하기</h2>
            <p className="mt-3 text-slate-600">행사 정보를 잠시 불러오지 못했어요. 전체 목록에서 다시 확인해 주세요.</p>
            <Link href="/events" prefetch={false} className="mt-5 w-fit font-bold text-brand underline underline-offset-4">
                전체 행사 보기
            </Link>
        </section>
    );
}

function getSafeErrorLog(error: unknown) {
    if (error instanceof Error) {
        return { name: error.name, message: error.message };
    }

    return { type: typeof error };
}
