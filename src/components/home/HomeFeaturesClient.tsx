"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Bell, CalendarDays } from "lucide-react";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import FeatureCarousel from "@/src/components/ui/feature-carousel";
import type { HomeEventPreview, HomeJobPreview } from "./home-preview-data";
import CalendarPreview from "./CalendarPreview";
import styles from "./home.module.css";

const features = [
  { id: "bookmarks", title: "내 북마크", description: "다시 보고 싶은 행사와 채용 공고를 한곳에 모아두세요." },
  { id: "calendar", title: "나의 캘린더", description: "북마크한 행사 일정을 달력으로 보고 휴대폰 기본 캘린더에도 추가해 보세요." },
  { id: "notifications", title: "필요한 알림", description: "북마크한 행사의 주요 일정과 모집 마감을 앱 알림으로 받아보세요." },
] as const;

type HomeFeaturesClientProps = {
  events: HomeEventPreview[];
  jobs: HomeJobPreview[];
};

export default function HomeFeaturesClient({ events, jobs }: HomeFeaturesClientProps) {
  return (
    <section id="features" className={styles.features} aria-labelledby="features-title">
      <div className={styles.container}>
        <div className={styles.featureSectionHeading}>
          <p className={styles.featureLabel}>맞춤 알림</p>
          <h2 id="features-title">당신의 픽을<br />놓치지 않도록</h2>
          <p className={styles.featureIntro}>발견한 순간부터 참여하는 날까지 챙겨드려요.</p>
        </div>
        <FeatureCarousel
          ariaLabel="듀잇 앱 기능"
          idPrefix="home-feature"
          items={features}
          initialIndex={2}
          classNames={{
            root: styles.featureCarousel,
            copy: styles.featureCarouselCopy,
            copyContent: styles.featureCarouselCopyContent,
            tabList: styles.featureCarouselTabs,
            tab: styles.featureCarouselTab,
            viewport: styles.featureCarouselViewport,
            slide: styles.featureCarouselSlide,
            controls: styles.featureCarouselControls,
            control: styles.featureCarouselControl,
          }}
          renderCopy={(feature, index) => (
            <>
              <span className={styles.featureCarouselStep}>0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </>
          )}
          renderTab={(feature) => feature.title}
          renderSlide={(feature) => (
            <div className={styles.demoSurface}>
              {feature.id === "bookmarks"
                ? <BookmarkPreview events={events} jobs={jobs} />
                : feature.id === "calendar"
                  ? <CalendarPreview />
                  : <NotificationPreview />}
            </div>
          )}
        />
        <a href="#download" className={styles.textLink + " " + styles.featureLink}>앱에서 만나보기 <ArrowRight size={19} strokeWidth={1.5} aria-hidden /></a>
      </div>
    </section>
  );
}

function BookmarkPreview({ events, jobs }: HomeFeaturesClientProps) {
  const [kind, setKind] = useState<"events" | "jobs">("events");

  return (
    <div className={styles.bookmarkPreview}>
      <h3>내 북마크</h3>
      <div className={styles.demoTabs} role="group" aria-label="북마크 종류">
        <button type="button" aria-pressed={kind === "events"} onClick={() => setKind("events")}>행사</button>
        <button type="button" aria-pressed={kind === "jobs"} onClick={() => setKind("jobs")}>채용</button>
      </div>
      {kind === "events" ? (
        events.length > 0 ? (
          <ul className={styles.savedList + " " + styles.savedEventList}>
            {events.map((event) => (
              <li key={event.id}>
                <span className={styles.savedEventImage}>
                  <EventThumbnail src={event.thumbnail} alt="" eager className={styles.savedEventThumbnail} />
                </span>
                <div className={styles.savedContent}>
                  <strong>{event.title}</strong>
                  <p>{event.eventType} · {event.hostName}</p>
                  <span>{event.date}</span>
                </div>
                <Image src="/images/app-ui/bookmark_red.png" alt="" width={18} height={18} className={styles.savedBookmarkAsset} />
              </li>
            ))}
          </ul>
        ) : <PreviewEmpty message="최근 등록된 행사를 불러오지 못했어요." />
      ) : (
        jobs.length > 0 ? (
          <ul className={styles.savedList + " " + styles.savedJobList}>
            {jobs.map((job) => (
              <li key={job.id}>
                <div className={styles.savedContent}>
                  <span className={styles.savedCompany}>{job.companyName}</span>
                  <strong>{job.title}</strong>
                  <p>{job.detail}</p>
                </div>
                <Image src="/images/app-ui/bookmark_red.png" alt="" width={18} height={18} className={styles.savedBookmarkAsset} />
              </li>
            ))}
          </ul>
        ) : <PreviewEmpty message="최근 채용 공고를 불러오지 못했어요." />
      )}
    </div>
  );
}

function PreviewEmpty({ message }: { message: string }) {
  return <p className={styles.previewEmpty}>{message}</p>;
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
