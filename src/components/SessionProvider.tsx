"use client";
import { useEffect } from "react";
import { observeSession } from "@/src/lib/auth/client";
import BookmarkProvider from "./BookmarkProvider";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    useEffect(observeSession, []);
    return <BookmarkProvider>{children}</BookmarkProvider>;
}
