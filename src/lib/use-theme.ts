"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useAppTheme() {
    const { resolvedTheme, setTheme } = useTheme();
    // localStorage and the system preference are only available after hydration.
    const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return { resolvedTheme: mounted ? resolvedTheme : undefined, setTheme };
}
