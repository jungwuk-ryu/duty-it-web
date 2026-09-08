import Image from "next/image";
import { ArrowDown, BatteryFull, Signal, Wifi } from "lucide-react";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import type { HomeEventPreview } from "./home-preview-data";
import HomeHeroCta from "./HomeHeroCta";
import styles from "./home.module.css";

type HomeHeroProps = {
  featuredEvents: HomeEventPreview[];
};

const FALLBACK_PHONE_EVENTS: HomeEventPreview[] = [
  { id: -1, title: "2026 간호 실무 심포지엄", thumbnail: null, eventType: "학술대회", hostName: "듀잇", date: "일정 확인" },
  { id: -2, title: "간호사를 위한 보수교육", thumbnail: null, eventType: "보수교육", hostName: "듀잇", date: "일정 확인" },
  { id: -3, title: "함께하는 의료 봉사", thumbnail: null, eventType: "봉사", hostName: "듀잇", date: "일정 확인" },
];

export default function HomeHero({ featuredEvents }: HomeHeroProps) {
  const phoneEvents = featuredEvents.length > 0 ? featuredEvents.slice(0, 3) : FALLBACK_PHONE_EVENTS;

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.container + " " + styles.heroLayout}>
        <div className={styles.heroCopy}>
          <h1 id="home-title">간호의 내일을,<br /><span>발견하는 곳.</span></h1>
          <p className={styles.heroDescription}>
            <span>배우고 경험하고 나아가는 당신을 위해.</span>
            <span>대외활동·행사를 듀잇에서 만나보세요.</span>
          </p>
          <div className={styles.heroActions}>
            <HomeHeroCta />
            <a href="#features" className={styles.textLink}>
              듀잇 알아보기 <ArrowDown size={18} strokeWidth={1.7} aria-hidden />
            </a>
          </div>
        </div>
        <figure className={styles.heroFigure} aria-label="실제 듀잇 앱의 행사 탐색 화면을 반영한 미리보기">
          <div className={styles.productStage} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.phone}>
              <div className={styles.phoneScreen}>
                <div className={styles.phoneStatus}>
                  <span>9:41</span>
                  <div className={styles.phoneIsland} />
                  <span><Signal size={12} /><Wifi size={12} /><BatteryFull size={16} /></span>
                </div>
                <div className={styles.phoneApp}>
                  <div className={styles.phoneBrand}>
                    <span>
                      <Image src="/images/app-ui/logo.png" alt="" width={16} height={16} />
                      듀잇 - Du it!
                    </span>
                    <span className={styles.phoneUtility}>
                      <Image src="/images/app-ui/bell.png" alt="" width={16} height={20} />
                      <Image src="/images/app-ui/hamburger.png" alt="" width={20} height={16} />
                    </span>
                  </div>
                  <div className={styles.phoneSearch}>
                    <Image src="/images/app-ui/search.png" alt="" width={16} height={16} />
                    <span>찾으시는 행사가 있나요?</span>
                  </div>
                  <div className={styles.phoneFilters}>
                    <span data-selected="true">전체</span>
                    <span><Image src="/images/app-ui/filter.png" alt="" width={16} height={16} />필터</span>
                    <span className={styles.phoneSort}>최신순<Image src="/images/app-ui/filter_sort.png" alt="" width={16} height={16} /></span>
                  </div>
                  <div className={styles.phoneEventList}>
                    {phoneEvents.map((event, index) => (
                      <article className={styles.phoneEvent} key={event.id}>
                        <div className={styles.phonePoster}>
                          <EventThumbnail src={event.thumbnail} alt="" eager={index === 0} className={styles.phoneEventThumbnail} />
                        </div>
                        <div className={styles.phoneEventCopy}>
                          <strong>{event.title}</strong>
                          <p><span>{event.eventType}</span>{event.hostName}</p>
                          <time className={styles.phoneEventDate}>{event.date}</time>
                        </div>
                        <Image src="/images/app-ui/bookmark_red.png" alt="" width={14} height={14} className={styles.phoneEventBookmark} />
                      </article>
                    ))}
                  </div>
                </div>
                <nav className={styles.phoneNav} aria-label="듀잇 앱 하단 메뉴">
                  <span data-selected="true"><Image src="/images/app-ui/paper.png" alt="" width={16} height={16} />행사</span>
                  <span><Image src="/images/app-ui/job.png" alt="" width={16} height={16} />채용</span>
                  <span><Image src="/images/app-ui/bookmark.png" alt="" width={16} height={16} />북마크</span>
                  <span><Image src="/images/app-ui/calendar.png" alt="" width={16} height={16} />캘린더</span>
                </nav>
                <div className={styles.phoneHomeBar} />
              </div>
            </div>
          </div>
          <figcaption className={styles.heroCaption}>듀잇 앱 화면</figcaption>
        </figure>
      </div>
    </section>
  );
}
