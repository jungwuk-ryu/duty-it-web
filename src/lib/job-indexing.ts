import { SITE_ORIGIN } from "./seo";

export type JobNotification = { url: string; type: "URL_UPDATED" | "URL_DELETED" };

export function getJobNotifications(urls: string[], type: string): JobNotification[] {
  if (type !== "URL_UPDATED" && type !== "URL_DELETED") throw new Error("알림 유형은 URL_UPDATED 또는 URL_DELETED여야 합니다.");
  if (!urls.length) throw new Error("--url로 채용 상세 URL을 지정하세요.");
  return [...new Set(urls)].map((value) => {
    const url = new URL(value);
    const id = url.pathname.match(/^\/jobs\/([1-9]\d*)$/)?.[1];
    if (url.origin !== SITE_ORIGIN || !id || !Number.isSafeInteger(Number(id)) || value !== `${SITE_ORIGIN}/jobs/${id}`) {
      throw new Error("듀잇의 정규 채용 상세 URL만 알릴 수 있습니다. 행사·목록·필터 URL은 대상이 아닙니다.");
    }
    return { url: value, type };
  });
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1].toLowerCase(), match[2]]));
}

function containsJobPosting(data: unknown): boolean {
  if (Array.isArray(data)) return data.some(containsJobPosting);
  if (!data || typeof data !== "object") return false;
  const item = data as Record<string, unknown>;
  return item["@type"] === "JobPosting" || containsJobPosting(item["@graph"]);
}

export function assertJobNotificationPage(notification: JobNotification, status: number, html: string): void {
  if (notification.type === "URL_DELETED") {
    if (status !== 404 && status !== 410) throw new Error(`삭제 알림 대상은 404 또는 410이어야 합니다: ${notification.url} (${status})`);
    return;
  }
  if (status !== 200) throw new Error(`갱신 알림 대상이 정상 상세 페이지가 아닙니다: ${notification.url} (${status})`);
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attributes(tag)).find((attr) => attr.rel === "canonical")?.href;
  if (canonical !== notification.url) throw new Error(`canonical이 일치하지 않습니다: ${notification.url}`);
  const noindex = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributes(tag))
    .some((attr) => ["robots", "googlebot"].includes(attr.name?.toLowerCase()) && /\bnoindex\b/i.test(attr.content));
  const hasJobPosting = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].some(([, attrs, body]) => {
    if (attributes(attrs).type !== "application/ld+json") return false;
    try { return containsJobPosting(JSON.parse(body)); } catch { return false; }
  });
  // A retained expired job is notified as UPDATED so Google sees its noindex.
  if (!hasJobPosting && !noindex) throw new Error(`JobPosting 또는 마감 페이지의 noindex를 확인할 수 없습니다: ${notification.url}`);
}

export async function publishJobNotifications(notifications: JobNotification[], accessToken: string, fetcher: typeof fetch = fetch) {
  if (!accessToken.trim()) throw new Error("GOOGLE_INDEXING_ACCESS_TOKEN이 필요합니다.");
  // Validate the whole plan against the deployed pages before consuming quota.
  for (const notification of notifications) {
    const page = await fetcher(notification.url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    assertJobNotificationPage(notification, page.status, await page.text());
  }
  for (const notification of notifications) {
    const response = await fetcher("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify(notification),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Indexing API 오류 ${response.status}: ${notification.url}. 앞서 성공한 URL은 다시 보내지 마세요.`);
    console.info(JSON.stringify({ ...notification, accepted: true, status: response.status }));
  }
}
