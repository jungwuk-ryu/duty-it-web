"use client";

import Image from "next/image";
import { useState } from "react";

const EVENT_THUMBNAIL_FALLBACK = "/event-thumbnail-placeholder.svg";

type Props = {
    alt: string;
    className: string;
    eager?: boolean;
    priority?: boolean;
    src: string | null;
};

export default function EventThumbnail({
    alt,
    className,
    eager = false,
    priority = false,
    src,
}: Props) {
    const preferredSrc = getEventThumbnailSource(src);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const imageSrc = failedSrc === preferredSrc ? EVENT_THUMBNAIL_FALLBACK : preferredSrc;

    return (
        <Image
            src={imageSrc}
            alt={alt}
            fill
            loading={priority ? undefined : eager ? "eager" : undefined}
            onError={() => {
                if (imageSrc !== EVENT_THUMBNAIL_FALLBACK) {
                    setFailedSrc(preferredSrc);
                }
            }}
            priority={priority}
            className={className}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
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
