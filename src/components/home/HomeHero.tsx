import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bell, Bookmark, BriefcaseBusiness, CalendarDays, Check, Search, Signal, Wifi, BatteryFull } from "lucide-react";
import CalendarPreview from "./CalendarPreview";
import styles from "./home.module.css";

export default function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={`${styles.container} ${styles.heroLayout}`}>
        <div className={styles.heroCopy}>
          <h1 id="home-title">간호의 내일을,<br /><span>발견하는 곳.</span></h1>
          <p className={styles.heroDescription}>
            <span>배우고 경험하고 나아가는 당신을 위해.</span>
            <span>간호 행사부터 채용까지, 듀잇에서 만나보세요.</span>
          </p>
          <div className={styles.heroActions}>
            <Link href="/events" className={styles.primaryLink}>
              기회 둘러보기 <ArrowRight size={20} strokeWidth={1.7} aria-hidden />
            </Link>
            <a href="#features" className={styles.textLink}>
              듀잇 알아보기 <ArrowDown size={18} strokeWidth={1.7} aria-hidden />
            </a>
          </div>
          <p className={styles.heroNote}>간호사와 간호대학생을 위한 기회 모음</p>
        </div>
        <figure className={styles.heroFigure} aria-label="듀잇 앱의 행사 탐색, 북마크, 캘린더 기능을 표현한 화면 예시">
          <div className={styles.productStage} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.floatingCalendar}><CalendarPreview compact /></div>
            <div className={styles.phone}>
              <div className={styles.phoneScreen}>
                <div className={styles.phoneStatus}>
                  <span>9:41</span><div className={styles.phoneIsland} />
                  <span><Signal size={12} /><Wifi size={12} /><BatteryFull size={16} /></span>
                </div>
                <div className={styles.phoneApp}>
                  <div className={styles.phoneBrand}>
                    <span><Image src="/app-icon-transparent.png" alt="" width={25} height={25} />듀잇</span>
                    <Bell size={17} strokeWidth={1.6} />
                  </div>
                  <p className={styles.phoneTitle}>어떤 기회를<br />찾고 있나요?</p>
                  <div className={styles.phoneSearch}><Search size={13} /><span>관심 있는 행사를 찾아보세요</span></div>
                  <div className={styles.phoneTabs}><span>전체</span><span>학술대회</span><span>봉사</span><span>교육</span></div>
                  <div className={styles.phoneEvent}>
                    <div className={styles.phonePoster}>
                      <Image src="/images/home/next-chapter.webp" alt="" fill sizes="260px" priority className={styles.posterImage} />
                      <div><strong>간호의<br />다음 장</strong><span>배움이 모여,<br />내일의 간호가 됩니다</span></div>
                    </div>
                    <div className={styles.phoneEventCopy}>
                      <span>새로운 배움</span><strong>간호 활동과 새로운 배움</strong>
                      <p><CalendarDays size={12} /> 나에게 맞는 기회를 만나보세요</p>
                    </div>
                  </div>
                  <div className={styles.phoneSaved}><Check size={13} /> 관심 있는 기회를 모아보세요 <Bookmark size={13} /></div>
                </div>
                <div className={styles.phoneNav}>
                  <span><CalendarDays size={18} />행사</span><span><BriefcaseBusiness size={18} />채용</span>
                  <span><Bookmark size={18} />북마크</span><span><CalendarDays size={18} />캘린더</span>
                </div>
                <div className={styles.phoneHomeBar} />
              </div>
            </div>
            <div className={styles.floatingBookmark}>
              <Bookmark size={27} strokeWidth={1.5} /><strong>발견한 기회를 내 것으로</strong>
              <span>관심 있는 행사와 채용을 저장해요</span>
            </div>
          </div>
          <figcaption className={styles.heroCaption}>앱 화면 예시</figcaption>
        </figure>
      </div>
    </section>
  );
}
