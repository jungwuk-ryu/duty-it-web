import { increaseViewCount } from "@/src/lib/api/increaseView";
import { guardViewCountRequest } from "@/src/lib/api/viewGuard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = body != null && typeof body === "object" && "eventId" in body
    ? body.eventId
    : null;
  const decision = guardViewCountRequest(eventId, req.headers);

  if (!decision.allowed && decision.reason === "invalid_event_id") {
    return NextResponse.json({ ok: false, error: "Invalid eventId" }, { status: 400 });
  }

  if (!decision.allowed && decision.reason === "duplicate_view") {
    return NextResponse.json({ ok: true, counted: false }, { status: 202 });
  }

  if (!decision.allowed) {
    return NextResponse.json({ ok: false, error: "Too many view requests" }, { status: decision.status });
  }

  try {
    const updated = await increaseViewCount(decision.eventId);
    if (!updated) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to increase event view count", getSafeErrorLog(error));
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true, counted: true });
}

function getSafeErrorLog(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { type: typeof error };
}
