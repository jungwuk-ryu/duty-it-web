"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import HomeEventCard from "./HomeEventCard";
import type { HomeEventGroup } from "./home-event-groups";
import styles from "./home.module.css";

export default function HomeEventCollection({ groups }: { groups: readonly HomeEventGroup[] }) {
  const [selectedId, setSelectedId] = useState<HomeEventGroup["id"]>("all");
  const selected = groups.find((group) => group.id === selectedId) ?? groups[0];
  if (!selected) return null;

  return (
    <>
      <div className={styles.eventFilters} role="group" aria-label="홈 행사 분야">
        {groups.map((group) => (
          <button key={group.id} type="button" aria-pressed={selected.id === group.id} aria-controls="home-event-results" onClick={() => setSelectedId(group.id)}>
            {group.label}
          </button>
        ))}
      </div>
      <div id="home-event-results" className={styles.eventResults}>
        <span className="sr-only" role="status">
          {selected.events === null ? `${selected.label} 행사 정보를 불러오지 못했어요.` : `${selected.label} 행사 ${selected.events.length}개`}
        </span>
        {selected.events !== null && selected.events.length > 0 ? (
          <ul key={selected.id} className={styles.eventGrid} tabIndex={0} aria-label={`${selected.label} 행사. 좁은 화면에서는 좌우로 스크롤할 수 있어요.`}>
            {selected.events.map((event) => <li key={event.id}><HomeEventCard event={event} /></li>)}
          </ul>
        ) : (
          <div className={styles.eventsEmpty}>
            <CalendarDays size={30} strokeWidth={1.3} aria-hidden />
            <h3>{selected.events === null ? "행사 정보를 잠시 불러오지 못했어요." : "지금은 예정된 행사가 없어요."}</h3>
            <p>{selected.events === null ? "전체 목록에서 다시 확인해 주세요." : "다른 분야의 기회도 둘러보세요."}</p>
            <Link href={selected.href} prefetch={false} className={styles.textLink}>전체 목록 보기 <ArrowUpRight size={17} aria-hidden /></Link>
          </div>
        )}
      </div>
    </>
  );
}
