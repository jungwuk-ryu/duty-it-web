import Image from "next/image";
import { ArrowDown, BatteryFull, Signal, Wifi } from "lucide-react";
import HomeHeroCta from "./HomeHeroCta";
import styles from "./home.module.css";

const PHONE_MOCK_EVENTS = [
  {
    id: "clinical-workshop",
    title: "간호대학생 임상실습 준비 클래스 2기",
    image: "/images/home/hero-mock-clinical-workshop-flyer.png",
    eventType: "교육",
    hostName: "너스텝 아카데미",
    date: "2026. 10. 14.",
  },
  {
    id: "community-volunteer",
    title: "지역사회 건강돌봄 봉사 프로젝트 5기",
    image: "/images/home/hero-mock-community-volunteer-flyer.png",
    eventType: "봉사",
    hostName: "메디브릿지",
    date: "2026. 10. 24.",
  },
];

function formatPhoneEventDate(date: string) {
  const match = date.match(/^(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.$/);
  if (match == null) return date;

  const [, year, month, day] = match;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()];
  return `${year}년 ${month}월 ${day}일(${weekday})`;
}

export default function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.container + " " + styles.heroLayout}>
        <div className={styles.heroCopy}>
          <h1 id="home-title">간호의 내일을<br /><span>발견하는 곳</span></h1>
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
        <figure className={styles.heroFigure} aria-label="듀잇 앱 행사 탐색 목업">
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
                      <span className={styles.phoneBell}>
                        <Image src="/images/app-ui/bell.png" alt="" width={16} height={20} />
                      </span>
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
                    {PHONE_MOCK_EVENTS.map((event, index) => (
                      <article className={styles.phoneEvent} key={event.id}>
                        <div className={styles.phonePoster}>
                          <Image src={event.image} alt="" fill priority={index === 0} className={styles.phoneEventThumbnail} sizes="(max-width: 799px) 251px, 280px" />
                        </div>
                        <Image src="/images/app-ui/bookmark.png" alt="" width={20} height={20} className={styles.phoneEventBookmark} />
                        <div className={styles.phoneEventCopy}>
                          <strong>{event.title}</strong>
                          <dl className={styles.phoneEventMeta}>
                            <div><dt>카테고리</dt><dd>{event.eventType}</dd></div>
                            <div><dt>주최</dt><dd>{event.hostName}</dd></div>
                          </dl>
                          <time className={styles.phoneEventDate}><span>일시</span>{formatPhoneEventDate(event.date)}</time>
                        </div>
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
          <figcaption className={styles.heroCaption}>듀잇 앱 화면 예시</figcaption>
        </figure>
      </div>
    </section>
  );
}
