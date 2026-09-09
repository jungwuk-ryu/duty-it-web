import type { Metadata } from "next";
import BookmarksPage from "@/src/components/BookmarksPage";

export const metadata: Metadata = { title: "내 북마크 | 듀잇", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    return <BookmarksPage kind={type === "jobs" ? "jobs" : "events"} />;
}
