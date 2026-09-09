import EventDetailPanel from "@/src/components/events/EventDetailPanel";
export default function NotFound() {
  return <EventDetailPanel><div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"><h2 className="text-xl font-bold">행사를 찾을 수 없어요</h2><p className="text-muted-foreground">삭제되었거나 유효하지 않은 행사입니다.</p></div></EventDetailPanel>;
}
