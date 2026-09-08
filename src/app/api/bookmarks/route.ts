import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, authErrorResponse, PRIVATE_HEADERS, requireSession, upstreamFetch } from "@/src/lib/auth/server";
import { BookmarkKindSchema } from "@/src/lib/bookmarks";
import { EventSchema } from "@/src/lib/schemas/event";
import { JobPostingPageSchema } from "@/src/lib/schemas/job";

export const runtime = "nodejs";
const EventBookmarksSchema = z.object({
    content: z.array(z.object({ eventId: z.number().int().positive() })),
    pageInfo: z.object({ pageNumber: z.number(), totalPages: z.number() }),
});

export async function GET(request: Request) {
    try {
        const params = new URL(request.url).searchParams;
        const kind = BookmarkKindSchema.safeParse(params.get("kind"));
        const cursor = params.get("cursor");
        if (!kind.success || (cursor?.length ?? 0) > 2000) throw new AuthError("목록 정보를 확인해 주세요.", 400);
        const session = await requireSession();
        if (kind.data === "jobs") {
            const query = new URLSearchParams({ bookmarked: "true", size: "12" });
            if (cursor) query.set("cursor", cursor);
            const response = await upstreamFetch(`/v1/job-postings?${query}`, session.accessToken);
            const result = JobPostingPageSchema.parse(await response.json());
            return NextResponse.json({ content: result.content, next: result.pageInfo.hasNext ? result.pageInfo.nextCursor : null }, { headers: PRIVATE_HEADERS });
        }
        const page = cursor === null ? 0 : Number(cursor);
        if (!Number.isSafeInteger(page) || page < 0) throw new AuthError("페이지 정보를 확인해 주세요.", 400);
        // Includes finished events, unlike the public ACTIVE event list.
        const response = await upstreamFetch(`/v1/bookmarks?page=${page}&size=12&field=ID&sortDirection=DESC`, session.accessToken);
        const bookmarks = EventBookmarksSchema.parse(await response.json());
        const content = await Promise.all(bookmarks.content.map(async ({ eventId }) => {
            try {
                const detail = await upstreamFetch(`/v2/events/${eventId}`, session.accessToken);
                return { id: eventId, event: EventSchema.parse(await detail.json()) };
            } catch (error) {
                if (error instanceof AuthError && [403, 404].includes(error.status)) return { id: eventId, event: null };
                throw error;
            }
        }));
        return NextResponse.json({ content, next: page + 1 < bookmarks.pageInfo.totalPages ? String(page + 1) : null }, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
