import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCESS_TOKEN_COOKIE = "duit_access_token";
const MAX_ID_TOKEN_LENGTH = 10_000;

type UpstreamAuthResponse = {
    accessToken: string;
    user: Record<string, unknown>;
    isNewUser: boolean;
};

export async function POST(request: Request) {
    const idToken = await getIdToken(request);
    if (!idToken) {
        return errorResponse("로그인 정보를 확인할 수 없습니다. 다시 시도해 주세요.");
    }

    const apiBase = process.env.API_BASE?.replace(/\/$/, "");
    if (!apiBase) {
        return NextResponse.json(
            { message: "로그인 서비스를 현재 사용할 수 없습니다." },
            { status: 503, headers: noStoreHeaders() },
        );
    }

    let upstreamResponse: Response;
    try {
        upstreamResponse = await fetch(`${apiBase}/v1/auth/social`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            // The API binds @RequestBody String verbatim, like the native app.
            // JSON.stringify would make the surrounding quotes part of the JWT.
            body: idToken,
            cache: "no-store",
        });
    } catch {
        return NextResponse.json(
            { message: "로그인 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." },
            { status: 502, headers: noStoreHeaders() },
        );
    }

    const body = await getJson(upstreamResponse);
    if (!upstreamResponse.ok) {
        return NextResponse.json(
            { message: getErrorMessage(body) ?? "로그인을 완료하지 못했습니다. 다시 시도해 주세요." },
            { status: upstreamResponse.status, headers: noStoreHeaders() },
        );
    }
    if (!isUpstreamAuthResponse(body)) {
        return NextResponse.json(
            { message: "로그인 응답 형식이 올바르지 않습니다. 잠시 뒤 다시 시도해 주세요." },
            { status: 502, headers: noStoreHeaders() },
        );
    }

    const response = NextResponse.json(
        {
            user: getPublicUser(body.user),
            isNewUser: body.isNewUser,
        },
        { headers: noStoreHeaders() },
    );
    response.cookies.set({
        name: ACCESS_TOKEN_COOKIE,
        value: body.accessToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    return response;
}

async function getIdToken(request: Request): Promise<string | null> {
    let value: unknown;
    try {
        value = await request.json();
    } catch {
        return null;
    }

    if (typeof value !== "string") return null;
    const idToken = value.trim();
    return idToken && idToken.length <= MAX_ID_TOKEN_LENGTH ? idToken : null;
}

async function getJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function isUpstreamAuthResponse(value: unknown): value is UpstreamAuthResponse {
    return (
        isRecord(value)
        && typeof value.accessToken === "string"
        && Boolean(value.accessToken.trim())
        && isRecord(value.user)
        && typeof value.isNewUser === "boolean"
    );
}

function getPublicUser(user: Record<string, unknown>) {
    return {
        nickname: typeof user.nickname === "string" ? user.nickname : "",
        email: typeof user.email === "string" ? user.email : undefined,
    };
}

function getErrorMessage(value: unknown): string | undefined {
    return isRecord(value) && typeof value.message === "string" && value.message.trim()
        ? value.message
        : undefined;
}

function errorResponse(message: string) {
    return NextResponse.json({ message }, { status: 400, headers: noStoreHeaders() });
}

function noStoreHeaders() {
    return { "Cache-Control": "no-store" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
