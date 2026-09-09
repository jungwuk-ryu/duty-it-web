"use client";

import { useEffect, useState } from "react";

export function useScroll(threshold = 10) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const resetThreshold = Math.max(0, threshold / 2);
        const updateScrolledState = () => {
            const scrollY = window.scrollY;
            setScrolled((current) => {
                if (scrollY > threshold) return true;
                if (scrollY <= resetThreshold) return false;
                return current;
            });
        };

        updateScrolledState();
        window.addEventListener("scroll", updateScrolledState, { passive: true });
        return () => window.removeEventListener("scroll", updateScrolledState);
    }, [threshold]);

    return scrolled;
}
