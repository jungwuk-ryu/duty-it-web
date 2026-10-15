import { NextResponse } from "next/server";
import { authErrorResponse, createSession, PRIVATE_HEADERS, readSocialLoginRequest, requireSameOrigin, writeSession } from "@/src/lib/auth/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const body = await readSocialLoginRequest(request);
        if (!body) return NextResponse.json({ message: "로그인 정보를 확인해 주세요." }, { status: 400, headers: PRIVATE_HEADERS });
        const { session, isNewUser } = await createSession(body.refreshToken, undefined, body.agreedTermsVersion);
        return writeSession(NextResponse.json({ user: session.user, isNewUser }, { headers: PRIVATE_HEADERS }), session);
    } catch (error) { return authErrorResponse(error); }
}
