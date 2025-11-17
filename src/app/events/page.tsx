import EventCard from "@/src/components/ui/EventCard";
import { fetchEvents } from "@/src/lib/api/events";
import { Metadata } from "next";
import Link from "next/link";

type Props = { searchParams: { page?: string } };

export async function generateMetadata(
    { searchParams }: Props): Promise<Metadata> {
    const page = Number(searchParams.page ?? "1");
    const title = `간호 행사 목록 ${page}페이지 | 듀잇`;
    let canonical = 'https://www.dutyit.net/events';
    if (page != 1) canonical += `?page=${page}`;

    return {
        title: title,
        alternates: {
            canonical: canonical
        },
        openGraph: {
            url: canonical,
            title: title,
          },
    };
}

export default async function EventsPage({ searchParams }: Props) {
    const page = Number(searchParams.page ?? "1");

    const { content, pageInfo } = await fetchEvents({ page: page - 1 });
    const totalPages = pageInfo.totalPages;

    const indexStartPage = Math.max(page - 3, 1);

    return (
        <div className="container mx-auto px-4 mb-5 py-10">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-3">행사 목록</h1>
                <h2 className="text-xl text-gray-600 font-bold mb-5">{page} 페이지</h2>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-7">
                {
                    content.map((event) => (
                        <li key={event.id}><EventCard event={event} /></li>
                    ))
                }
            </ul>
            <nav className="mt-8 flex items-center justify-center gap-5">
                {page > 1 && (
                    <Link href={`/events?page=${page - 1}`} className="bg-white border border-gray-300 rounded-xl drop-shadow-lg px-3 py-1">
                        이전
                    </Link>
                )}
                {Array.from({ length: 6 }, (_, i) => i)
                    .filter(i => (indexStartPage + i) <= totalPages)
                    .map((_, i) => {
                        const p = indexStartPage + i;
                        return (
                            <Link key={p} href={`/events${p > 1 ? `?page=${p}` : ""}`} className={p == page ? "underline" : "text-gray-600"}>
                                {p}
                            </Link>
                        );
                    })}
                {page < totalPages && (
                    <Link href={`/events?page=${page + 1}`} className="bg-white border border-gray-300 rounded-xl drop-shadow-lg px-3 py-1">
                        다음
                    </Link>
                )}
            </nav>
        </div>
    );
}