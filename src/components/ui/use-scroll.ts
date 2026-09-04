"use client";

import { useEffect, useState } from "react";

export function useScroll(threshold = 10) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const updateScrolledState = () => setScrolled(window.scrollY > threshold);

        updateScrolledState();
        window.addEventListener("scroll", updateScrolledState, { passive: true });
        return () => window.removeEventListener("scroll", updateScrolledState);
    }, [threshold]);

    return scrolled;
}
