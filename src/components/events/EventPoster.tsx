"use client";

import { lazy, Suspense } from "react";
import { Expand } from "lucide-react";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import { Button } from "@/src/components/ui/button";
import styles from "./event-detail.module.css";

// The server still renders the button; the dialog code loads while the page hydrates instead of before the poster.
const EventPosterViewer = lazy(() => import("./EventPosterViewer"));

export default function EventPoster({ src, title }: { src: string | null; title: string }) {
  const safeSource = src?.startsWith("https://api.dutyit.net/uploads/") ? src : null;
  return <div className={styles.poster}>
    <div className="absolute inset-0"><EventThumbnail src={src} alt={`${title} 행사 안내 포스터`} className="object-cover object-top" sizes="(min-width: 1024px) 560px, 100vw" priority /></div>
    {safeSource && <Suspense fallback={<Button variant="outline" size="sm" className="absolute bottom-3 right-3 gap-2 rounded-full bg-background/95 shadow-sm" disabled><Expand size={14} aria-hidden />포스터 전체 보기</Button>}>
      <EventPosterViewer src={safeSource} title={title} />
    </Suspense>}
  </div>;
}
