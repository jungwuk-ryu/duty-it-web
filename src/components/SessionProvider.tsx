"use client";
import { useEffect } from "react";
import { InitialAuthContext, observeSession } from "@/src/lib/auth/client";
import type { AuthState } from "@/src/lib/auth/state";
import BookmarkProvider from "./BookmarkProvider";
import NotificationProvider from "./NotificationProvider";

export default function SessionProvider({ children, initialAuth }: { children: React.ReactNode; initialAuth: AuthState }) {
    useEffect(() => observeSession(initialAuth), [initialAuth]);
    return <InitialAuthContext.Provider value={initialAuth}><BookmarkProvider><NotificationProvider>{children}</NotificationProvider></BookmarkProvider></InitialAuthContext.Provider>;
}
