import { SITE_ORIGIN } from "./seo";

export type SitemapEntry = { url: string; lastModified?: string; images?: string[] };
export type SitemapPage<T> = { content: T[]; pageInfo: { hasNext: boolean; nextCursor?: string | null } };
export type SitemapDocuments = Map<string, string>;
export const SITEMAP_MAX_URLS = 50_000;
export const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n';
const URLSET_OPEN = `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
const URLSET_CLOSE = "</urlset>\n";

export async function collectSitemapEntries<T extends { id: number }>(
  fetchPage: (cursor: string | null) => Promise<SitemapPage<T>>,
  toEntry: (item: T) => SitemapEntry | null,
): Promise<SitemapEntry[]> {
  const entries = new Map<number, SitemapEntry>();
  const seenIds = new Set<number>();
  const cursors = new Set<string>();
  let cursor: string | null = null;
  for (;;) {
    const page = await fetchPage(cursor);
    const previousCount = seenIds.size;
    for (const item of page.content) {
      if (!Number.isSafeInteger(item.id) || item.id <= 0) throw new Error("Invalid sitemap item ID.");
      seenIds.add(item.id);
      const entry = toEntry(item);
      if (entry) entries.set(item.id, entry);
      else entries.delete(item.id);
    }
    if (!page.pageInfo.hasNext) break;
    const next = page.pageInfo.nextCursor;
    if (!next?.trim() || cursors.has(next) || seenIds.size === previousCount) {
      throw new Error("Sitemap pagination did not advance; refusing a partial sitemap.");
    }
    cursors.add(next);
    cursor = next;
  }
  return [...entries].sort(([a], [b]) => a - b).map(([, entry]) => entry);
}

function escapeXml(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function entryXml(entry: SitemapEntry): string {
  return `<url><loc>${escapeXml(new URL(entry.url).href)}</loc>${entry.lastModified ? `<lastmod>${escapeXml(entry.lastModified)}</lastmod>` : ""}${(entry.images ?? []).map((image) => `<image:image><image:loc>${escapeXml(new URL(image).href)}</image:loc></image:image>`).join("")}</url>\n`;
}

export function buildSitemapDocuments(
  groups: Record<string, SitemapEntry[]>,
  limits = { urls: SITEMAP_MAX_URLS, bytes: SITEMAP_MAX_BYTES },
): SitemapDocuments {
  if (limits.urls < 1 || limits.urls > SITEMAP_MAX_URLS || limits.bytes > SITEMAP_MAX_BYTES) throw new Error("Invalid sitemap limits.");
  const documents: SitemapDocuments = new Map();
  for (const [group, entries] of Object.entries(groups)) {
    let rows: string[] = [];
    let bytes = Buffer.byteLength(URLSET_OPEN + URLSET_CLOSE);
    let part = 0;
    const flush = () => {
      documents.set(`${group}-${part++}`, URLSET_OPEN + rows.join("") + URLSET_CLOSE);
      rows = [];
      bytes = Buffer.byteLength(URLSET_OPEN + URLSET_CLOSE);
    };
    for (const entry of entries) {
      const row = entryXml(entry);
      const rowBytes = Buffer.byteLength(row);
      if (rowBytes + Buffer.byteLength(URLSET_OPEN + URLSET_CLOSE) > limits.bytes) throw new Error("Sitemap entry exceeds XML size limit.");
      if (rows.length >= limits.urls || bytes + rowBytes > limits.bytes) flush();
      rows.push(row);
      bytes += rowBytes;
    }
    if (rows.length) flush();
  }
  if (!documents.size) throw new Error("Cannot publish an empty sitemap index.");
  if (documents.size > SITEMAP_MAX_URLS) throw new Error("Sitemap index exceeds URL limit.");
  const index = `${XML_HEADER}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...documents.keys()].map((name) => `<sitemap><loc>${SITE_ORIGIN}/sitemap-${name}.xml</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
  if (Buffer.byteLength(index) > SITEMAP_MAX_BYTES) throw new Error("Sitemap index exceeds XML size limit.");
  documents.set("index", index);
  return documents;
}

// Each process publishes only complete snapshots. On a cold start an upstream
// failure is a 503; a warm process may serve its last success for up to one hour.
export function createSitemapCache<T>(
  load: () => Promise<T>,
  { now = Date.now, ttl = 300_000, maxAge = 3_600_000, retryAfter = 30_000 } = {},
) {
  type Snapshot = { value: T; createdAt: number; stale: boolean };
  let lastGood: Snapshot | undefined;
  let pending: Promise<Snapshot> | undefined;
  let retryAt = 0;
  let failure: unknown;
  return async function getSnapshot(): Promise<Snapshot> {
    const age = lastGood ? now() - lastGood.createdAt : Infinity;
    if (lastGood && age < ttl) return lastGood;
    if (pending) return pending;
    if (now() < retryAt) {
      if (lastGood && age < maxAge) return { ...lastGood, stale: true };
      throw failure;
    }
    pending = (async () => {
      try {
        const value = await load();
        lastGood = { value, createdAt: now(), stale: false };
        retryAt = 0;
        return lastGood;
      } catch (error) {
        failure = error;
        retryAt = now() + retryAfter;
        if (lastGood && now() - lastGood.createdAt < maxAge) return { ...lastGood, stale: true };
        throw error;
      } finally {
        pending = undefined;
      }
    })();
    return pending;
  };
}
