import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { fetchEventDetail } from "@/src/lib/api/event-detail";
import { fetchEvents } from "@/src/lib/api/events";
import { getHostEventsHref } from "@/src/lib/event-detail";
import {
  getEventCanonicalUrl,
  getEventKeywords,
  getEventMetadataDescription,
  getEventSocialImage,
  getEventStructuredData,
  serializeJsonLd,
} from "@/src/lib/event-seo";
import EventDetail from "@/src/components/events/EventDetail";
import EventContentSummary from "@/src/components/events/EventContentSummary";
import EventCard from "@/src/components/ui/EventCard";
import styles from "@/src/components/events/event-detail.module.css";
import { getBreadcrumbStructuredData, getPageMetadata } from "@/src/lib/seo";

type Props = { params: Promise<{ eventId: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await fetchEventDetail((await params).eventId);
  const url = getEventCanonicalUrl(event.id);
  const description = getEventMetadataDescription(event);
  const image = getEventSocialImage(event);
  return {
    ...getPageMetadata({ title: `${event.title} | 듀잇`, description, url, image }),
    keywords: getEventKeywords(event),
  };
}
export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const event = await fetchEventDetail(eventId);
  const jsonLd = [getEventStructuredData(event), getBreadcrumbStructuredData("events", event.title, getEventCanonicalUrl(event.id))];
  return <div className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <Link href="/events?view=list" className={styles.back}><ArrowLeft size={16} aria-hidden />행사 목록으로</Link>
    <EventDetail
      key={event.id}
      event={event}
      eventContent={<Suspense fallback={null}><EventContentSummary eventId={eventId} /></Suspense>}
    />
    <Suspense fallback={null}><HostEvents hostId={event.host.id} name={event.host.name} eventId={event.id} /></Suspense>
  </div>;
}
async function HostEvents({ hostId, name, eventId }: { hostId: number; name: string; eventId: number }) {
  const result = await fetchEvents({ hostId, size: 4 }).catch(() => null);
  const events = result?.content.filter((event) => event.id !== eventId).slice(0, 3) ?? [];
  if (!events.length) return null;
  return <section className={styles.related} aria-label="같은 주최의 다른 행사">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="mb-2 text-xs text-muted-foreground">{name}</p><h2 className="text-xl font-bold">같은 주최의 다른 행사</h2></div>
      <Link href={getHostEventsHref(hostId)} className="flex items-center gap-1 text-sm font-bold">전체 보기<ArrowUpRight size={16} aria-hidden /></Link>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{events.map((item) => <EventCard key={item.id} event={item} />)}</div>
  </section>;
}
