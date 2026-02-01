const API_BASE = process.env.API_BASE!;
const ID = process.env.DUIT_ID!;
const PWD = process.env.DUIT_PWD!;

export async function increaseViewCount(eventId: string | number) {
  const loginRes = await fetch(`${API_BASE}/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId: ID, password: PWD }),
    cache: "no-store",
  });

  if (!loginRes.ok) throw new Error("login failed");

  const { accessToken } = await loginRes.json();
  if (!accessToken) throw new Error("no accessToken");

  await fetch(`${API_BASE}/v1/views/${encodeURIComponent(String(eventId))}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}
