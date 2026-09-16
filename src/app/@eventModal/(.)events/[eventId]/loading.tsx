import EventDetailPanel from "@/src/components/events/EventDetailPanel";
export default function Loading() {
  return <EventDetailPanel><div role="status" className="flex flex-1 items-center justify-center text-sm text-muted-foreground">행사 정보를 불러오고 있어요.</div></EventDetailPanel>;
}
