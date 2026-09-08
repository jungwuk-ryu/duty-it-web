import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./home.module.css";

export default function HomeHeroCta() {
  return (
    <Link href="/events" className={styles.primaryLink}>
      행사 둘러보기
      <ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" />
    </Link>
  );
}
