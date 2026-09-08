"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Bell, BookOpen, Bookmark, BriefcaseBusiness, CalendarDays, Check, HandHeart } from "lucide-react";
import CalendarPreview from "./CalendarPreview";
import styles from "./home.module.css";

const features = [
  { id: "bookmarks", title: "내 북마크", description: "다시 보고 싶은 행사와 채용 공고를 한곳에 모아두세요.", note: "다시 찾을 땐, 한곳에서" },
  { id: "calendar", title: "나의 캘린더", description: "북마크한 행사 일정을 달력으로 보고 휴대폰 기본 캘린더에도 추가해 보세요.", note: "내 일정에 맞춰, 한눈에" },
  { id: "notifications", title: "필요한 알림", description: "북마크한 행사의 주요 일정과 모집 마감을 앱 알림으로 받아보세요.", note: "놓치기 쉬운 날도 챙겨요" },
] as const;

const savedEvents = [
  { title: "관심 있는 학술대회", description: "배움을 넓히는 시간", icon: BookOpen, tone: "rose" },
  { title: "함께하는 간호 봉사", description: "경험을 나누는 자리", icon: HandHeart, tone: "lilac" },
  { title: "다시 듣고 싶은 보수교육", description: "차근차근 쌓아가는 배움", icon: CalendarDays, tone: "sage" },
];
const savedJobs = [
  { title: "눈여겨본 채용 공고", description: "다음 커리어를 위한 선택", icon: BriefcaseBusiness, tone: "sage" },
  { title: "관심 지역의 간호 채용", description: "일하고 싶은 곳을 찾아서", icon: BriefcaseBusiness, tone: "rose" },
];

export default function HomeFeatures() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % features.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + features.length) % features.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = features.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="features" className={styles.features} aria-labelledby="features-title">
      <div className={`${styles.container} ${styles.featureLayout}`}>
        <div className={styles.featureCopy}>
          <p className={styles.featureLabel}>듀잇 앱</p>
          <h2 id="features-title">찾아둔 기회,<br />놓치지 않도록.</h2>
          <p className={styles.featureIntro}>발견한 순간부터 참여하는 날까지 챙겨드려요.</p>
          <div className={styles.featureTabs} role="tablist" aria-label="듀잇 앱 기능" aria-orientation="vertical">
            {features.map((feature, index) => (
              <button key={feature.id} type="button" role="tab" id={`feature-tab-${feature.id}`} aria-controls={`feature-panel-${feature.id}`}
                aria-selected={active === index} tabIndex={active === index ? 0 : -1}
                ref={(element) => { tabRefs.current[index] = element; }} onClick={() => setActive(index)} onKeyDown={(event) => handleKeyDown(event, index)}>
                <span className={styles.featureNumber}>0{index + 1}</span>
                <span><strong>{feature.title}</strong>{active === index && <span className={styles.featureDescription}>{feature.description}</span>}</span>
              </button>
            ))}
          </div>
          <a href="#download" className={`${styles.textLink} ${styles.featureLink}`}>앱에서 만나보기 <ArrowRight size={19} strokeWidth={1.5} aria-hidden /></a>
        </div>
        <div className={styles.featureDemo}>
          {features.map((feature, index) => (
            <div key={feature.id} id={`feature-panel-${feature.id}`} role="tabpanel" aria-labelledby={`feature-tab-${feature.id}`} hidden={active !== index} tabIndex={0} className={styles.featurePanel}>
              <div className={styles.demoSurface}>
                {feature.id === "bookmarks" ? <BookmarkPreview /> : feature.id === "calendar" ? <CalendarPreview /> : <NotificationPreview />}
              </div>
              <div className={styles.demoNote}><span><Check size={23} strokeWidth={1.5} aria-hidden /></span><strong>{feature.note}</strong></div>
            </div>
          ))}
          <p className={styles.demoCaption}>이해를 돕기 위한 화면 예시</p>
        </div>
      </div>
    </section>
  );
}

function BookmarkPreview() {
  const [kind, setKind] = useState<"events" | "jobs">("events");
  const items = kind === "events" ? savedEvents : savedJobs;
  return (
    <div className={styles.bookmarkPreview}>
      <h3>내가 모아둔 기회</h3>
      <div className={styles.demoTabs} role="group" aria-label="북마크 화면 예시 종류">
        <button type="button" aria-pressed={kind === "events"} onClick={() => setKind("events")}>행사</button>
        <button type="button" aria-pressed={kind === "jobs"} onClick={() => setKind("jobs")}>채용</button>
      </div>
      <ul className={styles.savedList}>
        {items.map(({ title, description, icon: Icon, tone }) => (
          <li key={title}>
            <span className={styles.demoIcon} data-tone={tone}><Icon size={28} strokeWidth={1.35} aria-hidden /></span>
            <div><strong>{title}</strong><p>{description}</p></div>
            <Bookmark className={styles.savedMark} size={20} fill="currentColor" strokeWidth={1.5} aria-hidden />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotificationPreview() {
  return (
    <div className={styles.notificationPreview}>
      <div className={styles.previewHeading}><span>나에게 필요한 소식</span><Bell size={22} strokeWidth={1.5} aria-hidden /></div>
      <p className={styles.notificationIntro}>관심 있는 기회의 중요한 순간</p>
      <div className={styles.notificationItem}>
        <span className={styles.demoIcon} data-tone="rose"><CalendarDays size={24} strokeWidth={1.4} aria-hidden /></span>
        <div><span>북마크한 행사</span><strong>모집 마감일을 확인해 보세요.</strong><p>관심 있는 행사의 주요 일정을 알려드려요.</p></div>
      </div>
      <div className={styles.notificationItem}>
        <span className={styles.demoIcon} data-tone="lilac"><Bell size={24} strokeWidth={1.4} aria-hidden /></span>
        <div><span>맞춤 알림</span><strong>새로운 기회가 도착했어요.</strong><p>관심 분야의 행사와 채용 소식을 받아보세요.</p></div>
      </div>
      <p className={styles.notificationFootnote}>듀잇 앱의 알림 설정에서 관리할 수 있어요.</p>
    </div>
  );
}
