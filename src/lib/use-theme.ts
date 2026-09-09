"use client";

import { useTheme } from "next-themes";
import { useCallback, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useAppTheme() {
    const { resolvedTheme, setTheme: persistTheme } = useTheme();
    // localStorage and the system preference are only available after hydration.
    const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const setTheme = useCallback((theme: string) => {
        const root = document.documentElement;

        // Apply the visual state immediately, then let next-themes persist it.
        // This keeps the toggle reliable during hydration and development refreshes.
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.style.colorScheme = theme;
        persistTheme(theme);
    }, [persistTheme]);

    return { resolvedTheme: mounted ? resolvedTheme : undefined, setTheme };
}
