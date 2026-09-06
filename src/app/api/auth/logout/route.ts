import { NextResponse } from "next/server";
import { authErrorResponse, clearSession, PRIVATE_HEADERS, requireSameOrigin } from "@/src/lib/auth/server";

export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        return clearSession(NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS }));
    } catch (error) { return authErrorResponse(error); }
}
