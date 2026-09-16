"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Expand, X } from "lucide-react";
import { useState } from "react";
import EventThumbnail from "@/src/components/ui/EventThumbnail";
import { Button } from "@/src/components/ui/button";
import styles from "./event-detail.module.css";

export default function EventPoster({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const safeSource = src?.startsWith("https://api.dutyit.net/uploads/") ? src : null;
  return <div className={styles.poster}>
    <div className="absolute inset-0"><EventThumbnail src={src} alt={`${title} 행사 안내 포스터`} className="object-cover object-top" sizes="(min-width: 1024px) 560px, 100vw" priority /></div>
    {safeSource && <Dialog.Root>
      <Dialog.Trigger asChild><Button variant="outline" size="sm" className="absolute bottom-3 right-3 gap-2 rounded-full bg-background/95 shadow-sm"><Expand size={14} aria-hidden />포스터 전체 보기</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={`${styles.overlay} !z-[110]`} />
        <Dialog.Content className={styles.posterViewer} aria-describedby={undefined}>
          <div className={styles.viewerToolbar}><Dialog.Title className="text-sm font-bold">행사 포스터</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" className="rounded-full" aria-label="포스터 닫기"><X size={20} /></Button></Dialog.Close></div>
          <div className={styles.viewerScroll}>
            {failed ? <p role="status" className="p-8 text-center text-muted-foreground">포스터를 불러오지 못했어요. 주최 페이지에서 확인해 주세요.</p> :
              // Preserve the original poster's complete content and natural height.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeSource} alt={`${title} 전체 포스터`} onError={() => setFailed(true)} />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>}
  </div>;
}
