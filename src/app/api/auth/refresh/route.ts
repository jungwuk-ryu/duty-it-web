import { NextResponse } from "next/server";
import { AuthError, authErrorResponse, createSession, PRIVATE_HEADERS, readSession, requireSameOrigin, writeSession } from "@/src/lib/auth/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const previous = await readSession();
        if (!previous) throw new AuthError("로그인이 필요합니다.", 401, true);
        const { session } = await createSession(previous.refreshToken, previous);
        return writeSession(NextResponse.json({ user: session.user }, { headers: PRIVATE_HEADERS }), session);
    } catch (error) { return authErrorResponse(error); }
}
