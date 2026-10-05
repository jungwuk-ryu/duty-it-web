import type { PublicUser } from "./session-crypto";

export type AuthState = {
    status: "authenticated" | "guest" | "error";
    user: PublicUser | null;
    message: string | null;
};

export const GUEST: AuthState = { status: "guest", user: null, message: null };
