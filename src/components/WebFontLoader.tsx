"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WEB_FONT_COOKIE } from "@/src/lib/web-font";

const ATTRIBUTE = "data-web-font";

/**
 * Korean web fonts are split into many slices. On a first visit they would compete with the poster and
 * app code, and swapping them in after load relays out the whole page. Like `font-display: optional`,
 * the first page therefore keeps the system font while the slices it uses download in the background.
 * The font then applies from the next client-side navigation, and from the first paint of later page
 * loads, which the server detects through WEB_FONT_COOKIE.
 */
export default function WebFontLoader() {
    const pathname = usePathname();
    const firstPathname = useRef(pathname);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (document.documentElement.hasAttribute(ATTRIBUTE)) return;
        let canceled = false;
        let idle: number | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const prefetch = () => {
            // Only the web font itself: its metric fallback is a local("Arial") face, absent on Android, whose
            // failure would reject the whole load.
            const family = getComputedStyle(document.documentElement).getPropertyValue("--font-noto-sans-kr").split(",")[0]?.trim();
            const text = document.body.innerText;
            if (!family || !document.fonts) return;
            // Loads only the unicode-range slices this page's text needs, without restyling anything yet.
            void Promise.all(["400", "700"].map((weight) => document.fonts.load(`${weight} 16px ${family}`, text))).then(() => {
                document.cookie = `${WEB_FONT_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax`;
                if (!canceled) setReady(true);
            }, () => { /* The page stays on the system font. */ });
        };
        const schedule = () => {
            if ("requestIdleCallback" in window) idle = window.requestIdleCallback(prefetch, { timeout: 2_000 });
            else timer = setTimeout(prefetch, 200);
        };
        if (document.readyState === "complete") schedule();
        else window.addEventListener("load", schedule, { once: true });
        return () => {
            canceled = true;
            window.removeEventListener("load", schedule);
            if (idle !== undefined) window.cancelIdleCallback(idle);
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        // Switch while the next page renders, so the change never reflows a page being read.
        if (ready && pathname !== firstPathname.current) document.documentElement.setAttribute(ATTRIBUTE, "");
    }, [pathname, ready]);

    return null;
}
