"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const EVENT_THUMBNAIL_FALLBACK = "/event-thumbnail-placeholder.svg";
// Native lazy loading starts far below the fold; deferred cards wait until they are about to scroll in.
const DEFERRED_LOAD_MARGIN = "600px 0px";

type Props = {
    alt: string;
    className: string;
    /** Below-the-fold cards: request the image only near the viewport so it cannot delay the page's main image. */
    deferUntilNear?: boolean;
    eager?: boolean;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    src: string | null;
};

export default function EventThumbnail({
    alt,
    className,
    deferUntilNear = false,
    eager = false,
    priority = false,
    quality,
    sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw",
    src,
}: Props) {
    const preferredSrc = getEventThumbnailSource(src);
    const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(() => new Set());
    const [near, setNear] = useState(!deferUntilNear);
    const placeholderRef = useRef<HTMLSpanElement>(null);
    const imageSrc = failedSources.has(preferredSrc) ? EVENT_THUMBNAIL_FALLBACK : preferredSrc;

    useEffect(() => {
        const placeholder = placeholderRef.current;
        if (near || !placeholder) return;
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            setNear(true);
        }, { rootMargin: DEFERRED_LOAD_MARGIN });
        observer.observe(placeholder);
        return () => observer.disconnect();
    }, [near]);

    if (!near) return <span ref={placeholderRef} className="absolute inset-0" aria-hidden />;

    return (
        <Image
            src={imageSrc}
            // Event uploads are served directly so Vercel's transformation quota cannot hide them.
            unoptimized={!imageSrc.startsWith("/")}
            alt={alt}
            fill
            loading={priority ? undefined : eager ? "eager" : undefined}
            onError={() => {
                if (imageSrc !== EVENT_THUMBNAIL_FALLBACK) {
                    setFailedSources((currentSources) => {
                        if (currentSources.has(preferredSrc)) return currentSources;

                        const nextSources = new Set(currentSources);
                        nextSources.add(preferredSrc);
                        return nextSources;
                    });
                }
            }}
            // Next 16 `preload` only adds the preload link; the high fetch priority must be explicit.
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            quality={quality}
            className={className}
            sizes={sizes}
        />
    );
}

function getEventThumbnailSource(src: string | null): string {
    const normalizedSrc = src?.trim();
    if (normalizedSrc == null || normalizedSrc === "") return EVENT_THUMBNAIL_FALLBACK;
    if (normalizedSrc.startsWith("/")) return normalizedSrc;

    try {
        const url = new URL(normalizedSrc);
        return url.protocol === "https:"
            && url.hostname === "api.dutyit.net"
            && url.pathname.startsWith("/uploads/")
            ? normalizedSrc
            : EVENT_THUMBNAIL_FALLBACK;
    } catch {
        return EVENT_THUMBNAIL_FALLBACK;
    }
}
