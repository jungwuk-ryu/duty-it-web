import type { Metadata } from "next";
import NotificationsPage from "@/src/components/NotificationsPage";
import { NotificationPathIdSchema } from "@/src/lib/notifications";

export const metadata: Metadata = { title: "내 알림 | 듀잇", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; unread?: string; hostId?: string }> }) {
    const params = await searchParams;
    const host = NotificationPathIdSchema.safeParse(params.hostId);
    return <NotificationsPage tab={params.tab === "subscriptions" ? "subscriptions" : "inbox"} unread={params.unread === "true"} hostId={host.success ? host.data : undefined} />;
}
