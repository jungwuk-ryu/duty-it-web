import { notFound, redirect } from "next/navigation";
import { EventSchema } from "@/src/lib/schemas/event";
import { increaseViewCount } from "@/src/lib/api/increaseView";
import { guardViewCountRequest, normalizeViewEventId } from "@/src/lib/api/viewGuard";
import { withUtmSource } from "@/src/lib/url";
import { headers } from "next/headers";

const API_BASE = process.env.API_BASE!;

type Props = {
  params: Promise<{ eventId?: string }>;
};

export default async function Page({ params }: Props) {
  const { eventId } = await params;
  const normalizedEventId = normalizeViewEventId(eventId);
  if (!normalizedEventId) notFound();

  const res = await fetch(`${API_BASE}/v2/events/${encodeURIComponent(normalizedEventId)}`, {
    next: { revalidate: 0 },
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`행사 정보를 찾을 수 없어요`);

  const json = await res.json();
  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) throw new Error("행사 정보를 불러오는 중에 오류가 발생했어요.");

  const decision = guardViewCountRequest(normalizedEventId, await headers());
  if (decision.allowed) {
    try {
      const updated = await increaseViewCount(decision.eventId);
      if (!updated) {
        console.error("Failed to increase event view count");
      }
    } catch (error) {
      console.error("Failed to increase event view count", getSafeErrorLog(error));
    }
  }

  redirect(withUtmSource(parsed.data.uri));
}

function getSafeErrorLog(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { type: typeof error };
}
