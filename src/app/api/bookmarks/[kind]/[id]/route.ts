import { NextResponse } from "next/server";
import { AuthError, authErrorResponse, PRIVATE_HEADERS, requireSameOrigin, requireSession, upstreamFetch } from "@/src/lib/auth/server";
import { BookmarkIdSchema, BookmarkKindSchema, BookmarkToggleSchema } from "@/src/lib/bookmarks";

export const runtime = "nodejs";
type Context = { params: Promise<{ kind: string; id: string }> };

async function handle(context: Context, toggle: boolean) {
    const params = await context.params;
    const kind = BookmarkKindSchema.safeParse(params.kind);
    const id = BookmarkIdSchema.safeParse(params.id);
    if (!kind.success || !id.success) throw new AuthError("북마크 정보를 확인해 주세요.", 400);
    const session = await requireSession();
    const path = toggle
        ? kind.data === "events" ? `/v1/bookmarks/${id.data}` : `/v1/job-bookmarks/${id.data}`
        : kind.data === "events" ? `/v2/events/${id.data}` : `/v1/job-postings/${id.data}`;
    const response = await upstreamFetch(path, session.accessToken, toggle ? "POST" : "GET");
    const result = BookmarkToggleSchema.parse(await response.json());
    return NextResponse.json(result, { headers: PRIVATE_HEADERS });
}

export async function GET(_request: Request, context: Context) {
    try { return await handle(context, false); } catch (error) { return authErrorResponse(error); }
}
export async function POST(request: Request, context: Context) {
    try { requireSameOrigin(request); return await handle(context, true); } catch (error) { return authErrorResponse(error); }
}
