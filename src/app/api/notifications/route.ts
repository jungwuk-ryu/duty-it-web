import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, requireSession } from "@/src/lib/auth/server";
import { fetchNotifications } from "@/src/lib/api/notifications";

export const runtime = "nodejs";
export async function GET(request: Request) {
    try {
        const session = await requireSession();
        const result = await fetchNotifications(session.accessToken, new URL(request.url).searchParams);
        return NextResponse.json(result, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
