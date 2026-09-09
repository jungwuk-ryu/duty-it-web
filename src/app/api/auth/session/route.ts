import { NextResponse } from "next/server";
import { authErrorResponse, PRIVATE_HEADERS, requireSession, upstreamFetch } from "@/src/lib/auth/server";
import { PublicUserSchema } from "@/src/lib/auth/session-crypto";

export const runtime = "nodejs";
export async function GET() {
    try {
        const session = await requireSession();
        const response = await upstreamFetch("/v1/users/me", session.accessToken);
        const user = PublicUserSchema.parse(await response.json());
        return NextResponse.json({ user }, { headers: PRIVATE_HEADERS });
    } catch (error) { return authErrorResponse(error); }
}
