"use client";

import { BorderBeam as BorderBeamPrimitive } from "border-beam";
import { forwardRef } from "react";
import { useAppTheme } from "@/src/lib/use-theme";
import type {
    BorderBeamColorVariant,
    BorderBeamProps,
    BorderBeamSize,
    BorderBeamTheme,
} from "border-beam";

export type {
    BorderBeamColorVariant,
    BorderBeamProps,
    BorderBeamSize,
    BorderBeamTheme,
};

export const BorderBeam = forwardRef<HTMLDivElement, BorderBeamProps>(function BorderBeam({ theme, ...props }, ref) {
    const { resolvedTheme } = useAppTheme();
    const activeTheme = resolvedTheme === "dark" ? "dark" : "light";

    return <BorderBeamPrimitive {...props} ref={ref} theme={theme ?? activeTheme} />;
});

export default BorderBeam;
