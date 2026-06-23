import { increaseViewCount } from "@/src/lib/api/increaseView";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ViewRequestSchema = z.object({
  eventId: z.union([
    z.string().trim().min(1),
    z.number().int().positive(),
  ]),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ViewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid eventId" }, { status: 400 });
  }

  try {
    const updated = await increaseViewCount(parsed.data.eventId);
    if (!updated) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to increase event view count", error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
