import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, requireSameOrigin, requireSession } from "@/src/lib/auth/server";
import { readAllNotifications } from "@/src/lib/api/notifications";

export async function PATCH(request: Request) {
    try {
        requireSameOrigin(request);
        const session = await requireSession();
        await readAllNotifications(session.accessToken);
        return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
