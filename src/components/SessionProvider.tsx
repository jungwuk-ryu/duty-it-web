"use client";
import { useEffect } from "react";
import { observeSession } from "@/src/lib/auth/client";
import BookmarkProvider from "./BookmarkProvider";
import NotificationProvider from "./NotificationProvider";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    useEffect(observeSession, []);
    return <BookmarkProvider><NotificationProvider>{children}</NotificationProvider></BookmarkProvider>;
}
