"use client";

import * as Popover from "@radix-ui/react-popover";
import { Apple, Bookmark, CalendarPlus, Check, Download, ExternalLink, Link2, LoaderCircle, MoreHorizontal, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBookmark } from "@/src/components/BookmarkProvider";
import { checkSession, useAuth } from "@/src/lib/auth/client";
import { createEventCalendarIcs, getEventCalendarFilename, getGoogleCalendarUrl } from "@/src/lib/event-calendar";
import { Button } from "@/src/components/ui/button";
import { ExpandableActionBar } from "@/src/components/ui/expandable-action-bar";

interface EventActionsProps {
  eventId: number;
  title: string;
  hostName: string;
  startAt: Date;
  endAt: Date | null;
  initialSaved: boolean;
}

export default function EventActions({ eventId, title, hostName, startAt, endAt, initialSaved }: EventActionsProps) {
  const auth = useAuth();
  const router = useRouter();
  const { entry, toggle } = useBookmark("events", eventId);
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const saved = Boolean(auth.user) && (entry?.saved ?? initialSaved);
  const pending = auth.status === "loading" || Boolean(auth.user && (!entry || entry.pending));
  const shareUrl = () => new URL(`/events/${eventId}`, window.location.origin).href;
  const calendarInput = () => ({ eventId, title, hostName, startAt, endAt, eventUrl: shareUrl() });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setManualLink("");
      setMessage("행사 링크를 복사했어요.");
    } catch {
      setManualLink(shareUrl());
      setMessage("아래 링크를 선택해 복사해 주세요.");
    }
  }

  async function share() {
    if (!navigator.share) { await copyLink(); return; }
    try {
      await navigator.share({ title, url: shareUrl() });
      setMessage("행사 공유를 마쳤어요.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      await copyLink();
    }
  }

  async function bookmark() {
    if (auth.status === "error") { await checkSession(); return; }
    if (!auth.user) { router.push(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`); return; }
    await toggle();
  }

  function downloadCalendarFile(target: "file" | "apple") {
    const blob = new Blob([createEventCalendarIcs(calendarInput())], { type: "text/calendar;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getEventCalendarFilename(title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    setCalendarOpen(false);
    setMessage(target === "apple" ? "Apple Calendar에서 열 수 있는 파일을 저장했어요." : "캘린더 파일을 저장했어요.");
  }

  function openGoogleCalendar() {
    window.open(getGoogleCalendarUrl(calendarInput()), "_blank", "noopener,noreferrer");
    setCalendarOpen(false);
    setMessage("Google Calendar를 새 탭에서 열었어요.");
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="행사 더보기" title="링크 복사, 공유, 북마크, 캘린더 저장">
          <MoreHorizontal size={22} aria-hidden />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={10} collisionPadding={12} className="z-[100] max-w-[calc(100vw-24px)] outline-none" aria-label="행사 공유 및 저장">
          <ExpandableActionBar
            defaultExpanded
            expandOnHover={false}
            classNames={{ item: "h-10 min-w-10 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]", track: "shadow-lg", activeItem: "text-brand" }}
            items={[
              { id: "copy", label: copied ? "복사됨" : "링크 복사", icon: copied ? <Check size={16} /> : <Link2 size={16} />, onClick: () => void copyLink() },
              { id: "share", label: "공유", icon: <Share2 size={16} />, onClick: () => void share() },
              { id: "bookmark", label: saved ? "저장됨" : "북마크", active: saved, disabled: pending, icon: pending ? <LoaderCircle size={16} className="animate-spin" /> : <Bookmark size={16} fill={saved ? "currentColor" : "none"} />, onClick: () => void bookmark() },
              { id: "calendar", label: "캘린더", active: calendarOpen, icon: <CalendarPlus size={16} />, onClick: () => setCalendarOpen((open) => !open) },
            ]}
          />
          {calendarOpen && <div className="mt-2 w-[min(25rem,calc(100vw-24px))] rounded-2xl border border-border bg-background p-3 text-foreground shadow-lg">
            <div className="flex items-start gap-3 px-1 pb-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><CalendarPlus size={18} aria-hidden /></span>
              <div><p className="text-sm font-bold">캘린더에 저장</p><p className="mt-1 text-xs leading-5 text-muted-foreground">행사명과 일정을 미리 채워드려요.</p></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="캘린더 저장 방식">
              <button type="button" onClick={() => downloadCalendarFile("file")} className="flex min-h-16 items-center gap-3 rounded-xl border border-border px-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand">
                <Download size={17} className="shrink-0" aria-hidden /><span><strong className="block text-xs">캘린더 파일</strong><span className="mt-1 block text-[11px] text-muted-foreground">.ics 저장</span></span>
              </button>
              <button type="button" onClick={openGoogleCalendar} className="flex min-h-16 items-center gap-3 rounded-xl border border-border px-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand">
                <ExternalLink size={17} className="shrink-0" aria-hidden /><span><strong className="block text-xs">Google</strong><span className="mt-1 block text-[11px] text-muted-foreground">새 탭에서 열기</span></span>
              </button>
              <button type="button" onClick={() => downloadCalendarFile("apple")} className="flex min-h-16 items-center gap-3 rounded-xl border border-border px-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand">
                <Apple size={17} className="shrink-0" aria-hidden /><span><strong className="block text-xs">Apple</strong><span className="mt-1 block text-[11px] text-muted-foreground">.ics로 열기</span></span>
              </button>
            </div>
          </div>}
          {(message || entry?.error || manualLink) && <div className="mt-2 max-w-80 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground shadow-md">
            <p role="status">{entry?.error ?? message}</p>
            {manualLink && <input aria-label="복사할 행사 링크" className="mt-2 w-full rounded border border-input bg-canvas p-2 text-foreground" readOnly value={manualLink} onFocus={(e) => e.currentTarget.select()} />}
          </div>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
