import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_RECHECK_MS, openSession, PublicUserSchema, sealSession, SESSION_MAX_AGE, type Session } from "./session-crypto";
import { firebaseConfig } from "../firebase/config";
import { TERMS_VERSION } from "../legal";
import { GUEST, type AuthState } from "./state";

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", Vary: "Cookie" };
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-duit_session" : "duit_session";
const COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export class AuthError extends Error {
    constructor(message: string, readonly status: number, readonly clearSession = false) { super(message); }
}

export function requireSameOrigin(request: Request) {
    const expected = process.env.AUTH_ORIGIN || new URL(request.url).origin;
    if (request.headers.get("origin") !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
        throw new AuthError("허용되지 않은 요청입니다.", 403);
    }
}

export async function readSession() { return openSession((await cookies()).get(COOKIE_NAME)?.value); }

// Only the display identity crosses the server/client boundary. API authorization
// still checks the session and renews expired access credentials separately.
export async function initialAuthState(): Promise<AuthState> {
    try {
        const session = await readSession();
        return session ? { status: "authenticated", user: session.user, message: null } : GUEST;
    } catch {
        return { status: "error", user: null, message: "로그인 연결을 확인하지 못했습니다. 다시 시도해 주세요." };
    }
}

export async function requireSession() {
    const session = await readSession();
    if (!session || session.refreshAfter <= Date.now()) throw new AuthError("로그인 확인이 필요합니다.", 401);
    return session;
}

export function writeSession(response: NextResponse, session: Session) {
    response.cookies.set(COOKIE_NAME, sealSession(session), { ...COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE });
    response.cookies.set("duit_access_token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    return response;
}

export function clearSession(response: NextResponse) {
    response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    response.cookies.set("duit_access_token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    return response;
}

export function authErrorResponse(error: unknown) {
    const known = error instanceof AuthError;
    const response = NextResponse.json({ message: known ? error.message : "서비스에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, {
        status: known ? error.status : 503, headers: PRIVATE_HEADERS,
    });
    return known && error.clearSession ? clearSession(response) : response;
}

export async function upstreamFetch(path: string, accessToken?: string, method = "GET", body?: string) {
    const base = process.env.API_BASE?.replace(/\/$/, "");
    if (!base) throw new AuthError("서비스를 현재 사용할 수 없습니다.", 503);
    const response = await fetch(`${base}${path}`, {
        method, body, cache: "no-store", signal: AbortSignal.timeout(15_000), redirect: "error",
        headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    });
    if (!response.ok) {
        const message = response.status === 401 ? "로그인 확인이 필요합니다."
            : response.status === 404 ? "정보를 찾을 수 없습니다."
                : response.status === 403 ? "이 요청을 처리할 권한이 없습니다."
                    : response.status === 400 ? "요청을 처리할 수 없습니다. 내용을 확인해 주세요."
                        : "서버 응답이 지연되고 있습니다. 잠시 뒤 다시 시도해 주세요.";
        throw new AuthError(message, response.status >= 500 ? 502 : response.status);
    }
    return response;
}

// Deletes the DuIt account; the API also deletes the Firebase Auth account.
export async function deleteAccount(accessToken: string) {
    try {
        await upstreamFetch("/v1/users", accessToken, "DELETE");
    } catch (error) {
        // Already deleted, for example from the app or by a retry after a lost response.
        if (error instanceof AuthError && error.status === 404) return;
        // The client renews the access credential and retries once.
        if (error instanceof AuthError && error.status === 401) throw error;
        throw new AuthError("회원 탈퇴를 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.", error instanceof AuthError && error.status < 500 ? error.status : 502);
    }
}

const FirebaseRefreshSchema = z.object({ id_token: z.string().min(1), refresh_token: z.string().min(1), user_id: z.string().min(1) });
const SocialResponseSchema = z.object({
    accessToken: z.string().min(1), user: PublicUserSchema.extend({ providerId: z.string() }), isNewUser: z.boolean(),
});

const SocialLoginRequestSchema = z.object({
    refreshToken: z.string().trim().min(1).max(3000),
    agreedTermsVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// The login form posts JSON with the agreed terms version. Tabs loaded before that
// change still post the bare refresh token as text/plain, so accept both formats.
// TODO(2026-11-15): the rollout window ends; reject text/plain logins with 400.
export async function readSocialLoginRequest(request: Request) {
    const text = await request.text().catch(() => "");
    let body: unknown = { refreshToken: text };
    if (request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        try { body = JSON.parse(text); } catch { return null; }
    }
    const parsed = SocialLoginRequestSchema.safeParse(body);
    if (!parsed.success) return null;
    // Record only the version this build shows. A tab opened before a terms update must reload it first.
    if (parsed.data.agreedTermsVersion && parsed.data.agreedTermsVersion !== TERMS_VERSION) {
        throw new AuthError("이용약관이 바뀌었어요. 페이지를 새로고침한 뒤 다시 동의해 주세요.", 409);
    }
    return parsed.data;
}

// Redeem the refresh token first so both credentials belong to the same verified account.
export async function createSession(refreshToken: string, previous?: Session, agreedTermsVersion?: string) {
    const firebaseResponse = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
        cache: "no-store", signal: AbortSignal.timeout(15_000), redirect: "error",
    });
    const firebaseBody: unknown = await firebaseResponse.json();
    if (!firebaseResponse.ok) {
        const parsed = z.object({ error: z.object({ message: z.string() }) }).safeParse(firebaseBody);
        const invalid = parsed.success && ["TOKEN_EXPIRED", "USER_DISABLED", "USER_NOT_FOUND", "INVALID_REFRESH_TOKEN"].includes(parsed.data.error.message);
        throw new AuthError(invalid ? "보안을 위해 다시 로그인해 주세요." : "로그인을 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", invalid ? 401 : 503, invalid && Boolean(previous));
    }
    const firebase = FirebaseRefreshSchema.parse(firebaseBody);
    if (previous && previous.uid !== firebase.user_id) throw new AuthError("다시 로그인해 주세요.", 401, true);
    // The DuIt API accepts the raw ID token or a JSON SocialLoginRequest. Only a login that
    // records terms agreement needs JSON; renewal keeps the raw token.
    const body = agreedTermsVersion ? JSON.stringify({ idToken: firebase.id_token, agreedTermsVersion }) : firebase.id_token;
    const response = await upstreamFetch("/v1/auth/social", undefined, "POST", body);
    const auth = SocialResponseSchema.parse(await response.json());
    if (auth.user.providerId !== firebase.user_id || (previous && previous.user.id !== auth.user.id)) throw new AuthError("다시 로그인해 주세요.", 401, true);
    const now = Date.now();
    const user = PublicUserSchema.parse(auth.user);
    const session: Session = {
        user, uid: firebase.user_id, accessToken: auth.accessToken, refreshToken: firebase.refresh_token,
        refreshAfter: now + ACCESS_RECHECK_MS, expiresAt: now + SESSION_MAX_AGE * 1000,
    };
    return { session, isNewUser: auth.isNewUser };
}
