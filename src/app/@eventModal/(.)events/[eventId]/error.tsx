"use client";
import EventDetailPanel from "@/src/components/events/EventDetailPanel";
import { Button } from "@/src/components/ui/button";
export default function Error({ reset }: { reset: () => void }) {
  return <EventDetailPanel><div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"><h2 className="text-xl font-bold">행사를 불러오지 못했어요</h2><p className="text-muted-foreground">잠시 후 다시 시도해 주세요.</p><Button onClick={reset}>다시 시도</Button></div></EventDetailPanel>;
}
