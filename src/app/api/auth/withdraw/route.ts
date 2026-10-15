import { NextResponse } from "next/server";
import { authErrorResponse, clearSession, deleteAccount, PRIVATE_HEADERS, requireSameOrigin, requireSession } from "@/src/lib/auth/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const session = await requireSession();
        await deleteAccount(session.accessToken);
        return clearSession(NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS }));
    } catch (error) { return authErrorResponse(error); }
}
