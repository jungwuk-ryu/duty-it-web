"use client";

import * as Popover from "@radix-ui/react-popover";
import { Bookmark, Check, Link2, LoaderCircle, MoreHorizontal, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBookmark } from "@/src/components/BookmarkProvider";
import { checkSession, useAuth } from "@/src/lib/auth/client";
import { Button } from "@/src/components/ui/button";
import { ExpandableActionBar } from "@/src/components/ui/expandable-action-bar";

export default function EventActions({ eventId, title, initialSaved }: { eventId: number; title: string; initialSaved: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const { entry, toggle } = useBookmark("events", eventId);
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [copied, setCopied] = useState(false);
  const saved = Boolean(auth.user) && (entry?.saved ?? initialSaved);
  const pending = auth.status === "loading" || Boolean(auth.user && (!entry || entry.pending));
  const shareUrl = () => new URL(`/events/${eventId}`, window.location.origin).href;

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

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="행사 더보기" title="링크 복사, 공유, 북마크">
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
            ]}
          />
          {(message || entry?.error || manualLink) && <div className="mt-2 max-w-80 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground shadow-md">
            <p role="status">{entry?.error ?? message}</p>
            {manualLink && <input aria-label="복사할 행사 링크" className="mt-2 w-full rounded border border-input bg-canvas p-2 text-foreground" readOnly value={manualLink} onFocus={(e) => e.currentTarget.select()} />}
          </div>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
