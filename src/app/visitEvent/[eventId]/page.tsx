import { notFound, redirect } from "next/navigation";
import { EventSchema } from "@/src/lib/schemas/event";
import { increaseViewCount } from "@/src/lib/api/increaseView";

const API_BASE = process.env.API_BASE!;

export default async function Page({ params }: { params: { eventId: string } }) {
  const eventId = params?.eventId;
  if (!eventId) notFound();

  const res = await fetch(`${API_BASE}/v2/events/${encodeURIComponent(eventId)}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`행사 정보를 찾을 수 없어요`);

  const json = await res.json();
  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) throw new Error("행사 정보를 불러오는 중에 오류가 발생했어요.");

  void increaseViewCount(eventId);

  redirect(parsed.data.uri);
}