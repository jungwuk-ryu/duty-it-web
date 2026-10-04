"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { launchEventApp } from "@/src/lib/event-app-launch";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { eventId: number };

export default function EventLink({ eventId, onClick, ...props }: Props) {
  return <Link prefetch={false} scroll={false} {...props} href={`/events/${eventId}`} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        (props.target && props.target !== "_self") || props.download) return;
    // Try during the tap, before client navigation loses browser user activation.
    launchEventApp(eventId);
  }} />;
}
