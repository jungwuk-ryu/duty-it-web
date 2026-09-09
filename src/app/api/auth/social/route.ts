import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, createSession, PRIVATE_HEADERS, requireSameOrigin, writeSession } from "@/src/lib/auth/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const parsed = z.string().trim().min(1).max(3000).safeParse(await request.text().catch(() => ""));
        if (!parsed.success) return NextResponse.json({ message: "로그인 정보를 확인해 주세요." }, { status: 400, headers: PRIVATE_HEADERS });
        const { session, isNewUser } = await createSession(parsed.data);
        return writeSession(NextResponse.json({ user: session.user, isNewUser }, { headers: PRIVATE_HEADERS }), session);
    } catch (error) { return authErrorResponse(error); }
}
