import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { openSession, sealSession, SESSION_MAX_AGE, type Session } from "./session-crypto.ts";

const secret = process.env.AUTH_SESSION_SECRET;
beforeEach(() => { process.env.AUTH_SESSION_SECRET = "a1".repeat(32); });
afterEach(() => { if (secret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = secret; });
const now = Date.now();
const session: Session = {
    user: { id: 7, nickname: "테스트" }, uid: "firebase-user", accessToken: "private-access-token", refreshToken: "private-refresh-token",
    refreshAfter: now + 1000, expiresAt: now + SESSION_MAX_AGE * 1000,
};

test("encrypted session persists across days even after access renewal is due", () => {
    const cookie = sealSession(session);
    assert.deepEqual(openSession(cookie, now + 7 * 86_400_000), session);
    assert.equal(cookie.includes(session.refreshToken), false);
    assert.equal(cookie.includes(session.accessToken), false);
    assert.notEqual(sealSession(session), cookie);
});

test("tampered, truncated, and expired cookies cannot authenticate", () => {
    const cookie = sealSession(session);
    const data = Buffer.from(cookie, "base64url");
    data[30] ^= 1;
    assert.equal(openSession(data.toString("base64url")), null);
    assert.equal(openSession(cookie.slice(0, 20)), null);
    assert.equal(openSession(cookie, session.expiresAt), null);
    assert.equal(openSession(undefined), null);
});

test("wrong key rejects cookies, missing configuration fails closed", () => {
    const cookie = sealSession(session);
    process.env.AUTH_SESSION_SECRET = "b2".repeat(32);
    assert.equal(openSession(cookie), null);
    delete process.env.AUTH_SESSION_SECRET;
    assert.throws(() => sealSession(session), /AUTH_SESSION_SECRET/);
    assert.throws(() => openSession(cookie), /AUTH_SESSION_SECRET/);
});

test("oversized cookies are rejected before sending to the browser", () => {
    assert.throws(() => sealSession({ ...session, refreshToken: "a".repeat(4000) }), /size limit/);
});
