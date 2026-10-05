import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, requireSameOrigin, requireSession } from "@/src/lib/auth/server";
import { readNotification } from "@/src/lib/api/notifications";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        requireSameOrigin(request);
        const session = await requireSession();
        await readNotification(session.accessToken, (await context.params).id);
        return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
