import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE!;
const ID = process.env.DUIT_ID!;
const PWD = process.env.DUIT_PWD!;

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const { eventId } = JSON.parse(bodyText || "{}");
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 });

  const loginRes = await fetch(`${API_BASE}/v1/admin/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminId: ID,
        password: PWD,
      }),
    }
  );
  if (!loginRes.ok) {
    return NextResponse.json({ ok: false, reason: "login failed" },
      { status: 401 });
  }
  const loginJson = await loginRes.json();
  const accessToken = loginJson.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, reason: "no accessToken" },
      { status: 500 }
    );
  }

  await fetch(`${API_BASE}/v1/views/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 }
  });

  return NextResponse.json({ ok: true });
}