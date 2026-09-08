import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { NextResponse } from "next/server";
import { AuthError, authErrorResponse, clearSession, createSession, PRIVATE_HEADERS, requireSameOrigin, writeSession } from "./server.ts";
import { openSession, type Session } from "./session-crypto.ts";

const env = { secret: process.env.AUTH_SESSION_SECRET, base: process.env.API_BASE, origin: process.env.AUTH_ORIGIN };
beforeEach(() => {
    process.env.AUTH_SESSION_SECRET = "a1".repeat(32);
    process.env.API_BASE = "https://api.example.test/api";
    delete process.env.AUTH_ORIGIN;
});
afterEach(() => {
    mock.restoreAll();
    for (const [key, value] of [["AUTH_SESSION_SECRET", env.secret], ["API_BASE", env.base], ["AUTH_ORIGIN", env.origin]]) {
        if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
    }
});
const previous: Session = {
    user: { id: 7, nickname: "테스트" }, uid: "firebase-user", accessToken: "old-access", refreshToken: "old-refresh",
    refreshAfter: 1, expiresAt: Date.now() + 86400000,
};

test("blocks foreign, missing, null, and same-site sibling origins", () => {
    for (const origin of ["https://evil.test", "https://other.dutyit.net", "null", ""]) {
        assert.throws(() => requireSameOrigin(new Request("https://www.dutyit.net/api/auth/logout", { headers: { origin } })), AuthError);
    }
    requireSameOrigin(new Request("https://www.dutyit.net/api/auth/logout", { headers: { origin: "https://www.dutyit.net" } }));
    process.env.AUTH_ORIGIN = "https://www.dutyit.net";
    requireSameOrigin(new Request("http://internal:3000/api/auth/logout", { headers: { origin: "https://www.dutyit.net" } }));
});

test("renews expired access with verified Firebase identity and raw upstream ID token", async () => {
    let calls = 0;
    mock.method(globalThis, "fetch", async (input: string | URL | Request, init: RequestInit) => {
        calls++;
        assert.equal(init.cache, "no-store");
        assert.equal(init.redirect, "error");
        if (String(input).startsWith("https://securetoken.googleapis.com/")) {
            assert.equal(String(init.body), "grant_type=refresh_token&refresh_token=old-refresh");
            return Response.json({ id_token: "verified-id", refresh_token: "rotated-refresh", user_id: "firebase-user" });
        }
        assert.equal(init.body, "verified-id");
        return Response.json({ accessToken: "new-access", user: { id: 7, nickname: "테스트", providerId: "firebase-user" }, isNewUser: false });
    });
    const { session } = await createSession(previous.refreshToken, previous);
    assert.equal(calls, 2);
    assert.equal(session.accessToken, "new-access");
    assert.equal(session.refreshToken, "rotated-refresh");
    assert.ok(session.refreshAfter > Date.now());
    assert.ok(session.expiresAt > Date.now() + 300 * 86400000);
});

test("temporary refresh errors preserve the durable session cookie", async () => {
    for (const message of ["TOO_MANY_ATTEMPTS_TRY_LATER", "PROJECT_NUMBER_MISMATCH"]) {
        mock.method(globalThis, "fetch", async () => Response.json({ error: { message } }, { status: 400 }));
        try { await createSession(previous.refreshToken, previous); assert.fail("Expected error"); }
        catch (error) {
            const response = authErrorResponse(error);
            assert.equal(response.status, 503);
            assert.equal(response.headers.has("set-cookie"), false);
        }
        mock.restoreAll();
    }
});

test("revoked, disabled, deleted, and invalid credentials end the session", async () => {
    for (const message of ["TOKEN_EXPIRED", "USER_DISABLED", "USER_NOT_FOUND", "INVALID_REFRESH_TOKEN"]) {
        mock.method(globalThis, "fetch", async () => Response.json({ error: { message } }, { status: 400 }));
        await assert.rejects(createSession(previous.refreshToken, previous), (error: unknown) => error instanceof AuthError && error.status === 401 && error.clearSession);
        mock.restoreAll();
    }
});

test("renewal cannot switch to a different Firebase or DuIt account", async () => {
    mock.method(globalThis, "fetch", async () => Response.json({ id_token: "id", refresh_token: "refresh", user_id: "other-user" }));
    await assert.rejects(createSession("old-refresh", previous), (error: unknown) => error instanceof AuthError && error.clearSession);
    mock.restoreAll();
    let calls = 0;
    mock.method(globalThis, "fetch", async () => ++calls === 1
        ? Response.json({ id_token: "id", refresh_token: "refresh", user_id: "firebase-user" })
        : Response.json({ accessToken: "access", user: { id: 8, nickname: "다른 계정", providerId: "firebase-user" }, isNewUser: false }));
    await assert.rejects(createSession("old-refresh", previous), (error: unknown) => error instanceof AuthError && error.clearSession);
});

test("browser receives only HttpOnly encrypted cookies and public user fields", async () => {
    const response = writeSession(NextResponse.json({ user: previous.user }, { headers: PRIVATE_HEADERS }), previous);
    const value = response.cookies.get("duit_session");
    assert.ok(value?.httpOnly);
    assert.equal(value.sameSite, "lax");
    assert.equal(value.path, "/");
    assert.ok((value.maxAge ?? 0) > 300 * 86400);
    assert.equal(openSession(value.value)?.refreshToken, "old-refresh");
    const body = await response.text();
    assert.equal(body.includes("old-refresh"), false);
    assert.equal(body.includes("old-access"), false);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(clearSession(NextResponse.json({ ok: true })).cookies.get("duit_session")?.maxAge, 0);
});
