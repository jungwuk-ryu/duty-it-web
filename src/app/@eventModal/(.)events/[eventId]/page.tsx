import { fetchEventDetail } from "@/src/lib/api/event-detail";
import EventDetail from "@/src/components/events/EventDetail";
import EventDetailPanel from "@/src/components/events/EventDetailPanel";

export default async function EventPanelPage({ params }: { params: Promise<{ eventId: string }> }) {
  const event = await fetchEventDetail((await params).eventId);
  return <EventDetailPanel event={event}><EventDetail key={event.id} event={event} variant="panel" /></EventDetailPanel>;
}
