import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

export const SESSION_MAX_AGE = 365 * 24 * 60 * 60;
export const ACCESS_RECHECK_MS = 55 * 60 * 1000;
export const PublicUserSchema = z.object({ id: z.number().int().positive(), nickname: z.string() });
export type PublicUser = z.infer<typeof PublicUserSchema>;
const SessionSchema = z.object({
    user: PublicUserSchema, uid: z.string().min(1), accessToken: z.string().min(1),
    refreshToken: z.string().min(1), refreshAfter: z.number(), expiresAt: z.number(),
});
export type Session = z.infer<typeof SessionSchema>;

function encryptionKey() {
    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret || !/^[a-f\d]{64}$/i.test(secret)) throw new Error("AUTH_SESSION_SECRET must be a stable 32-byte hex secret.");
    return Buffer.from(secret, "hex");
}

export function sealSession(session: Session): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    cipher.setAAD(Buffer.from("duit-web-session:v1"));
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
    const value = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
    // Leave room for the cookie name and attributes under browsers' 4 KB limit.
    if (value.length > 3800) throw new Error("Session exceeds cookie size limit.");
    return value;
}

export function openSession(value: string | undefined, now = Date.now()): Session | null {
    if (!value) return null;
    const key = encryptionKey(); // Configuration errors must not look like a logout.
    try {
        if (value.length > 3800) return null;
        const data = Buffer.from(value, "base64url");
        const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
        decipher.setAAD(Buffer.from("duit-web-session:v1"));
        decipher.setAuthTag(data.subarray(12, 28));
        const json = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
        const parsed = SessionSchema.safeParse(JSON.parse(json));
        return parsed.success && parsed.data.expiresAt > now ? parsed.data : null;
    } catch { return null; }
}
