import { CalendarDays } from "lucide-react";
import styles from "./home.module.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DAYS = Array.from({ length: 35 }, (_, index) => {
  const day = index - 1;
  return day > 0 && day <= 30 ? day : null;
});

// September 2026, used only in the clearly labelled product illustrations.
export default function CalendarPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? styles.calendarCompact : styles.calendarPreview}>
      <div className={styles.previewHeading}>
        <span>{compact ? "나의 일정" : "나의 캘린더"}</span>
        <CalendarDays size={compact ? 17 : 22} strokeWidth={1.6} aria-hidden />
      </div>
      <p className={styles.calendarMonth}>2026년 9월</p>
      <div className={styles.calendarGrid}>
        {WEEKDAYS.map((day) => <span className={styles.weekday} key={day}>{day}</span>)}
        {DAYS.map((day, index) => (
          <span key={index} className={day === 17 ? styles.selectedDay : day === 10 || day === 24 ? styles.markedDay : undefined}>
            {day}
          </span>
        ))}
      </div>
      {!compact && (
        <div className={styles.calendarAgenda}>
          <span>17<span>목요일</span></span>
          <div><strong>북마크한 행사 일정</strong><p>참여하고 싶은 날을 한눈에</p></div>
        </div>
      )}
    </div>
  );
}
