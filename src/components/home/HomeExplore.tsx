import Link from "next/link";
import { ArrowUpRight, BookOpen, Bookmark, BriefcaseBusiness, HandHeart } from "lucide-react";
import styles from "./home.module.css";

const destinations = [
  { title: "배움을 넓히고", description: "학술대회 · 보수교육", href: "/events?types=CONFERENCE,CONTINUING_EDUCATION", icon: BookOpen },
  { title: "경험을 쌓고", description: "봉사 · 서포터즈", href: "/events?types=VOLUNTEER,SUPPORTERS", icon: HandHeart },
  { title: "커리어를 찾고", description: "간호 채용 공고", href: "/jobs", icon: BriefcaseBusiness },
  { title: "기회를 모으고", description: "나만의 북마크", href: "/bookmarks", icon: Bookmark },
];

export default function HomeExplore() {
  return (
    <nav className={`${styles.container} ${styles.explore}`} aria-label="관심 있는 기회 바로가기">
      {destinations.map(({ title, description, href, icon: Icon }) => (
        <Link key={title} href={href} className={styles.exploreLink} prefetch={false}>
          <Icon size={32} strokeWidth={1.35} aria-hidden />
          <span><strong>{title}</strong><span>{description}</span></span>
          <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden />
        </Link>
      ))}
    </nav>
  );
}
