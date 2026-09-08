"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import SmokyButton from "@/src/components/ui/smoky-button";
import styles from "./home.module.css";

export default function HomeHeroCta() {
  const router = useRouter();

  return (
    <SmokyButton className={styles.heroCta} onClick={() => router.push("/events")}>
      <span>행사 둘러보기</span>
      <ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" />
    </SmokyButton>
  );
}
