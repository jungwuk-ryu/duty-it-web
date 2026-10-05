import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, requireSameOrigin, requireSession } from "@/src/lib/auth/server";
import { updatePushToken } from "@/src/lib/api/notifications";

export const runtime = "nodejs";
async function handle(request: Request, method: "PATCH" | "DELETE") {
    try {
        requireSameOrigin(request);
        const session = await requireSession();
        await updatePushToken(session.accessToken, await request.json().catch(() => null), method);
        return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
export async function PATCH(request: Request) { return handle(request, "PATCH"); }
export async function DELETE(request: Request) { return handle(request, "DELETE"); }
