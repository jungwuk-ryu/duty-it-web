import { Suspense } from "react";
import { fetchEventDetail } from "@/src/lib/api/event-detail";
import EventContentSummary from "@/src/components/events/EventContentSummary";
import EventDetail from "@/src/components/events/EventDetail";
import EventDetailPanel from "@/src/components/events/EventDetailPanel";

export default async function EventPanelPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await fetchEventDetail(eventId);
  return <EventDetailPanel event={event}>
    <EventDetail
      key={event.id}
      event={event}
      eventContent={<Suspense fallback={null}><EventContentSummary eventId={eventId} headingLevel="h3" /></Suspense>}
      variant="panel"
    />
  </EventDetailPanel>;
}
