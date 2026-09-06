import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/src/lib/utils";

type MarqueeProps = ComponentPropsWithoutRef<"div"> & {
    /** Whether to reverse the animation direction. */
    reverse?: boolean;
    /** Pause the moving track while its contents are hovered or focused. */
    pauseOnHover?: boolean;
    children: ReactNode;
    /** Animate the track vertically instead of horizontally. */
    vertical?: boolean;
    /** Two copies are enough for a seamless loop; higher values are opt-in. */
    repeat?: number;
    ariaLabel?: string;
    ariaLive?: "off" | "polite" | "assertive";
};

/**
 * A CSS-only, server-renderable marquee. Keeping it hook-free avoids adding a
 * client component boundary to pages that only need a decorative animation.
 */
export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 2,
    ariaLabel,
    ariaLive = "off",
    ...props
}: MarqueeProps) {
    const copies = Math.max(2, repeat);

    return (
        <div
            {...props}
            data-slot="marquee"
            className={cn(
                "group flex overflow-hidden [--gap:0.75rem] [gap:var(--gap)]",
                vertical ? "flex-col" : "flex-row",
                className,
            )}
            aria-label={ariaLabel}
            aria-live={ariaLive}
        >
            {Array.from({ length: copies }, (_, index) => (
                <div
                    key={index}
                    aria-hidden={index > 0 || undefined}
                    inert={index > 0}
                    className={cn(
                        "flex shrink-0 [gap:var(--gap)] [will-change:transform] motion-reduce:animate-none",
                        vertical ? "flex-col animate-marquee-vertical" : "flex-row animate-marquee",
                        pauseOnHover && "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
                        reverse && "[animation-direction:reverse]",
                    )}
                >
                    {children}
                </div>
            ))}
        </div>
    );
}
