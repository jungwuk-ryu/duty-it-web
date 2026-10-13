"use client";

import { lazy, Suspense, type ComponentProps } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";

// The server still renders the trigger; the popover, calendar and share code load while the page hydrates.
const EventActions = lazy(() => import("./EventActions"));

export default function LazyEventActions(props: ComponentProps<typeof EventActions>) {
  return <Suspense fallback={<Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="행사 더보기" disabled><MoreHorizontal size={22} aria-hidden /></Button>}>
    <EventActions {...props} />
  </Suspense>;
}
