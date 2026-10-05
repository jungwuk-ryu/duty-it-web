"use client";

import Link from "next/link";
import { Bell, LoaderCircle } from "lucide-react";
import { checkSession, useAuth } from "@/src/lib/auth/client";
import { useNotifications } from "./NotificationProvider";
import { Button, buttonVariants } from "./ui/button";
import BrowserPushSettings from "./notifications/BrowserPushSettings";
import NotificationInbox from "./notifications/NotificationInbox";
import EventSubscriptionsSettings from "./notifications/EventSubscriptionsSettings";

export default function NotificationsPage({ tab, unread, hostId }: { tab: "inbox" | "subscriptions"; unread: boolean; hostId?: number }) {
    const auth = useAuth();
    const { unreadCount } = useNotifications();
    const returnTo = tab === "subscriptions" ? "/notifications?tab=subscriptions" + (hostId ? "&hostId=" + hostId : "") : "/notifications";
    return <div className="mx-auto min-h-[65vh] max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Bell size={24} aria-hidden /></span>
            <div><h1 className="text-3xl font-bold tracking-tight text-foreground">내 알림</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">관심 있는 행사의 새 소식을 모아보세요.</p></div>
        </div>
        <nav aria-label="알림 메뉴" className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
            <Link href="/notifications" aria-current={tab === "inbox" ? "page" : undefined} className={buttonVariants({ variant: tab === "inbox" ? "default" : "outline" })}>
                알림함{unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
            </Link>
            <Link href="/notifications?tab=subscriptions" aria-current={tab === "subscriptions" ? "page" : undefined} className={buttonVariants({ variant: tab === "subscriptions" ? "default" : "outline" })}>새 행사 구독</Link>
        </nav>
        {auth.status === "loading" ? <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />로그인을 확인하고 있어요</div>
            : auth.user ? <div key={auth.user.id}>
                <BrowserPushSettings userId={auth.user.id} />
                {tab === "subscriptions" ? <EventSubscriptionsSettings initialHostId={hostId} /> : <>
                    <nav aria-label="알림 읽음 상태" className="mb-5 flex gap-2">
                        <Link href="/notifications" aria-current={!unread ? "page" : undefined} className={buttonVariants({ variant: !unread ? "secondary" : "ghost", size: "sm" })}>전체</Link>
                        <Link href="/notifications?unread=true" aria-current={unread ? "page" : undefined} className={buttonVariants({ variant: unread ? "secondary" : "ghost", size: "sm" })}>안 읽은 알림</Link>
                    </nav>
                    <NotificationInbox key={String(unread)} unread={unread} />
                </>}
            </div> : auth.status === "error" ? <div role="alert" className="flex flex-col items-center gap-4 py-16">
                <p className="text-sm">{auth.message}</p><Button variant="outline" onClick={() => void checkSession()}>로그인 다시 확인</Button>
            </div> : <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background px-5 py-16 text-center">
                <Bell size={36} className="text-muted-foreground" aria-hidden />
                <h2 className="text-xl font-bold">로그인하고 새 행사 소식을 받아보세요</h2>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">관심 있는 유형·키워드·주최자를 구독하고, 도착한 알림을 확인할 수 있어요.</p>
                <Button asChild><Link href={"/login?next=" + encodeURIComponent(returnTo)}>로그인하기</Link></Button>
            </div>}
    </div>;
}
