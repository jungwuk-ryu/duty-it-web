import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { fetchEvents } from "@/src/lib/api/events";
import HomeEventCollection from "@/src/components/home/HomeEventCollection";
import { HOME_EVENT_GROUPS, type HomeEventGroup } from "@/src/components/home/home-event-groups";
import styles from "@/src/components/home/home.module.css";

export default function HomeEvents() {
  return (
    <section id="upcoming-events" aria-labelledby="upcoming-events-title" className={styles.events}>
      <header className={styles.sectionHeading}>
        <div>
          <h2 id="upcoming-events-title">방금 올라온 행사</h2>
          <p>최근 올라온 행사와 대외활동을 모아뒀어요.</p>
        </div>
        <Link href="/events?field=CREATED_AT&statusGroup=ACTIVE" prefetch={false} className={styles.textLink}>
          전체 행사 보기 <ArrowUpRight size={20} strokeWidth={1.6} aria-hidden />
        </Link>
      </header>
      <Suspense fallback={<HomeEventsLoading />}>
        <HomeEventsContent />
      </Suspense>
      <div className={styles.jobsBanner}>
        <BriefcaseBusiness size={42} strokeWidth={1.2} aria-hidden />
        <div><h3>다음 근무지, 여기서 찾아보세요.</h3><p>지역과 경력에 맞는 간호 채용 공고를 모았어요.</p></div>
        <Link href="/jobs" prefetch={false} className={styles.outlineLink}>채용 공고 보기 <ArrowRight size={19} strokeWidth={1.6} aria-hidden /></Link>
      </div>
    </section>
  );
}

async function HomeEventsContent() {
  const groups: HomeEventGroup[] = await Promise.all(HOME_EVENT_GROUPS.map(async (group) => {
    const params = new URLSearchParams({ field: "CREATED_AT", statusGroup: "ACTIVE" });
    if (group.types.length > 0) params.set("types", group.types.join(","));
    const base = { id: group.id, label: group.label, href: `/events?${params.toString()}` };
    try {
      const { content } = await fetchEvents({ field: "CREATED_AT", statusGroup: "ACTIVE", size: 4, types: [...group.types] });
      return { ...base, events: content };
    } catch (error) {
      console.error("Failed to load home event group", { group: group.id, message: error instanceof Error ? error.message : "Unknown error" });
      return { ...base, events: null };
    }
  }));
  return <HomeEventCollection groups={groups} />;
}

function HomeEventsLoading() {
  return (
    <div role="status" aria-label="행사 정보를 불러오는 중이에요." className={styles.eventSkeleton}>
      {Array.from({ length: 4 }, (_, index) => <div key={index} aria-hidden="true"><span /></div>)}
    </div>
  );
}
