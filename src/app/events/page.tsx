import EventCard from "@/src/components/ui/EventCard";
import { fetchEvents } from "@/src/lib/api/events";
import { Metadata } from "next";
import Link from "next/link";

type Props = { searchParams: { cursor?: string | null } };

export async function generateMetadata(
    { searchParams }: Props): Promise<Metadata> {
    const title = `간호 행사 목록 | 듀잇`;
    let canonical = 'https://www.dutyit.net/events';

    return {
        title: title,
        alternates: {
            canonical: canonical
        },
        openGraph: {
            url: `canonical?cursor=${searchParams.cursor}`,
            title: title,
          },
    };
}

export default async function EventsPage({ searchParams }: Props) {
    const cursor = searchParams.cursor;

    const { content, pageInfo } = await fetchEvents({ cursor: cursor });
    const hasNext = pageInfo.hasNext;

    return (
        <div className="container mx-auto px-4 mb-5 py-10">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-3">행사 목록</h1>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-7">
                {
                    content.map((event) => (
                        <li key={event.id}><EventCard event={event} /></li>
                    ))
                }
            </ul>
            <nav className="mt-8 flex items-center justify-center gap-5">
                {hasNext && (
                    <Link href={`/events?cursor=${pageInfo.nextCursor}`} className="bg-white border border-gray-300 rounded-xl drop-shadow-lg px-3 py-1">
                        다음
                    </Link>
                )}
            </nav>
        </div>
    );
}