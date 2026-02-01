import { increaseViewCount } from "@/src/lib/api/increaseView";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const { eventId } = JSON.parse(bodyText || "{}");
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 });

  await increaseViewCount(eventId);
  return NextResponse.json({ ok: true });
}
