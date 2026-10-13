import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, readSession, requireSession, upstreamFetch } from "@/src/lib/auth/server";
import { PublicUserSchema } from "@/src/lib/auth/session-crypto";

export const runtime = "nodejs";
export async function GET() {
    try {
        // Without a session cookie the visitor is a guest, not an expired login to refresh.
        if (!await readSession()) return NextResponse.json({ user: null }, { headers: PRIVATE_HEADERS });
        const session = await requireSession();
        const response = await upstreamFetch("/v1/users/me", session.accessToken);
        const user = PublicUserSchema.parse(await response.json());
        return NextResponse.json({ user }, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
