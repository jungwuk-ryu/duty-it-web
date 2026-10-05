import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, requireSameOrigin, requireSession } from "@/src/lib/auth/server";
import { createEventSubscription, fetchEventSubscriptions } from "@/src/lib/api/notifications";

export const runtime = "nodejs";
export async function GET() {
    try {
        const session = await requireSession();
        return NextResponse.json(await fetchEventSubscriptions(session.accessToken), { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const session = await requireSession();
        const result = await createEventSubscription(session.accessToken, await request.json().catch(() => null));
        return NextResponse.json(result, { status: 201, headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
