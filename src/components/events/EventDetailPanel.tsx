"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { closeEventWithHero, isHeroOpening } from "@/src/lib/event-hero";
import type { Event } from "@/src/lib/schemas/event";
import EventActions from "./EventActions";
import { useNotifications } from "../NotificationProvider";
import styles from "./event-detail.module.css";

export default function EventDetailPanel({ children, event }: { children: ReactNode; event?: Event }) {
  const router = useRouter();
  const { setPromptContainer } = useNotifications();
  // A hero transition already animates the panel in; its own slide would fight it.
  const [heroOpened] = useState(() => isHeroOpening(event?.id));
  const close = () => router.back();
  return <Dialog.Root open onOpenChange={(open) => {
    if (open) return;
    if (!event || !closeEventWithHero(event.id, close)) close();
  }}>
    <Dialog.Portal>
      <Dialog.Overlay className={`${styles.overlay} ${heroOpened ? styles.heroOpened : ""}`} />
      <Dialog.Content className={`${styles.panel} ${heroOpened ? styles.heroOpened : ""}`} aria-describedby={undefined} onCloseAutoFocus={(e) => {
        e.preventDefault();
        // The route unmounts the dialog. Restore focus to the card that opened it.
        if (event) document.querySelector<HTMLAnchorElement>(`a[href="/events/${event.id}"]`)?.focus({ preventScroll: true });
      }}>
        <Dialog.Title className="sr-only">{event?.title ?? "행사 상세"}</Dialog.Title>
        <div className={styles.panelToolbar}>
          <span>행사 상세</span>
          <div className="flex items-center gap-1">
            {event && <EventActions eventId={event.id} title={event.title} hostName={event.host.name} startAt={event.startAt} endAt={event.endAt} initialSaved={event.isBookmarked} />}
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="행사 상세 닫기"><X size={22} aria-hidden /></Button></Dialog.Close>
          </div>
        </div>
        {children}
        <div ref={setPromptContainer} />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
