import { notFound, redirect } from "next/navigation";
import { EventSchema } from "@/src/lib/schemas/event";
import { increaseViewCount } from "@/src/lib/api/increaseView";
import { withUtmSource } from "@/src/lib/url";

const API_BASE = process.env.API_BASE!;

type Props = {
  params: Promise<{ eventId?: string }>;
};

export default async function Page({ params }: Props) {
  const { eventId } = await params;
  if (!eventId) notFound();

  const res = await fetch(`${API_BASE}/v2/events/${encodeURIComponent(eventId)}`, {
    next: { revalidate: 0 },
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`행사 정보를 찾을 수 없어요`);

  const json = await res.json();
  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) throw new Error("행사 정보를 불러오는 중에 오류가 발생했어요.");

  try {
    const updated = await increaseViewCount(eventId);
    if (!updated) {
      console.error("Failed to increase event view count");
    }
  } catch (error) {
    console.error("Failed to increase event view count", error);
  }

  redirect(withUtmSource(parsed.data.uri));
}
