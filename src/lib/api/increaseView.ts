const API_BASE = process.env.API_BASE!;

export async function increaseViewCount(eventId: string | number) {
  await fetch(`${API_BASE}/v1/views/${encodeURIComponent(String(eventId))}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}
