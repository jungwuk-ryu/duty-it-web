import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { SITE_ORIGIN } from "../src/lib/seo";

// Inspect HTTP response HTML only: no browser, JavaScript execution, or login.
const { values } = parseArgs({ options: {
  "base-url": { type: "string", default: SITE_ORIGIN },
  output: { type: "string" },
} });
const base = new URL(values["base-url"]!);
if (!/^https?:$/.test(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
  throw new Error("--base-url must be an HTTP(S) origin without credentials, path, query, or fragment.");
}
const userAgent = "DutyitSEOAudit/1.0";
type Row = {
  path: string; status?: number; contentType?: string; xRobotsTag?: string | null;
  title?: string; h1?: string[]; canonical?: string; robots?: string;
  structuredData?: string[]; urlCount?: number; checks: Record<string, boolean>; error?: string;
};
const rows: Row[] = [];
function decode(value: string) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39|#x27);/g, (entity) => ({
    "&amp;": "&", "&quot;": '"', "&apos;": "'", "&#39;": "'", "&#x27;": "'", "&lt;": "<", "&gt;": ">",
  })[entity]!);
}
function attributes(tag: string) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((m) => [m[1].toLowerCase(), decode(m[2] ?? m[3])]));
}
function textOnly(html: string) {
  return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
function flattenLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenLd);
  if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    return [node, ...flattenLd(node["@graph"])];
  }
  return [];
}
async function read(path: string, expectedStatus = 200) {
  const row: Row = { path, checks: {} };
  rows.push(row);
  try {
    const response = await fetch(new URL(path, base), {
      headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(150_000), redirect: "manual",
    });
    row.status = response.status;
    row.contentType = response.headers.get("content-type") ?? "";
    row.xRobotsTag = response.headers.get("x-robots-tag");
    row.checks.expectedStatus = response.status === expectedStatus;
    return { row, body: await response.text() };
  } catch (error) {
    row.checks.response = false;
    row.error = error instanceof Error ? error.message : String(error);
    return { row, body: "" };
  }
}
async function page(path: string, index = true, requiredTypes: string[] = []) {
  const { row, body } = await read(path);
  // RSC payloads may contain strings that resemble content; never count them as rendered HTML.
  const html = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attributes(m[0]));
  const meta = (name: string) => metas.find((m) => (m.name ?? m.property) === name)?.content ?? "";
  row.title = textOnly(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  row.h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOnly(m[1]));
  row.canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attributes(m[0])).find((a) => a.rel === "canonical")?.href;
  row.robots = meta("robots");
  const noindex = /(?:\bnoindex\b|\bnone\b)/i.test(row.robots + "," + (row.xRobotsTag ?? ""));
  row.checks.indexPolicy = index ? !noindex : noindex;
  row.checks.title = !!row.title;
  row.checks.description = !!meta("description");
  if (index) {
    row.checks.canonical = !!row.canonical && new URL(row.canonical, SITE_ORIGIN).href === new URL(path, SITE_ORIGIN).href;
    row.checks.h1 = row.h1.length === 1 && !!row.h1[0];
    row.checks.socialTitle = meta("og:title") === row.title && meta("twitter:title") === row.title;
    row.checks.socialDescription = meta("og:description") === meta("description") && meta("twitter:description") === meta("description");
    row.checks.socialUrl = !!meta("og:url") && new URL(meta("og:url"), SITE_ORIGIN).href === new URL(path, SITE_ORIGIN).href;
  }
  const nodes: Record<string, unknown>[] = [];
  row.checks.validJsonLd = true;
  for (const match of body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes(match[1]).type !== "application/ld+json") continue;
    try { nodes.push(...flattenLd(JSON.parse(match[2]))); } catch { row.checks.validJsonLd = false; }
  }
  row.structuredData = nodes.flatMap((node) => [node["@type"]].flat()).filter((type): type is string => typeof type === "string");
  for (const type of requiredTypes) row.checks[`schema:${type}`] = row.structuredData.includes(type);
  for (const node of nodes.filter((n) => n["@type"] === "FAQPage")) {
    const questions = node.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    const visible = textOnly(html);
    row.checks.faqMatchesHtml = Array.isArray(questions) && questions.length > 0 && questions.every((q) =>
      visible.includes(q.name) && visible.includes(q.acceptedAnswer.text));
  }
  if (path === "/") row.checks.aboutLinked = /href=["']\/about["']/.test(html);
  if (path === "/events") {
    row.checks.activityIntent = row.title.includes("대외활동") && row.h1.some((heading) => heading.includes("대외활동"));
    row.checks.activityGuideRendered = /id=["']events-activity-guide["']/.test(html) && textOnly(html).includes("참가 대상");
    row.checks.activityCategoryLinks = ["VOLUNTEER", "SUPPORTERS", "CONTEST"].every((type) => html.includes(`/events?types=${type}`));
  }
}

async function main() {
  // Sequential requests keep load small and make evidence order deterministic.
  await page("/", true, ["WebSite", "Organization"]);
  await page("/events");
  await page("/events?types=VOLUNTEER", false);
  await page("/events?q=%EB%B4%89%EC%82%AC", false);
  await page("/jobs");
  await page("/about", true, ["AboutPage", "FAQPage"]);
  for (const path of ["/login", "/bookmarks", "/submit-event"]) await page(path, false);
  await read("/seo-audit-missing-page", 404);
  const robots = await read("/robots.txt");
  robots.row.checks.sitemapDeclared = robots.body.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  robots.row.checks.wildcardPresent = /^User-agent:\s*\*\s*$/mi.test(robots.body);
  robots.row.checks.noSitewideBlock = !/^Disallow:\s*\/(?:\*|\$)?\s*$/mi.test(robots.body);
  const llms = await read("/llms.txt");
  llms.row.checks.plainText = llms.row.contentType?.includes("text/plain") ?? false;
  llms.row.checks.siteGuide = /^# 듀잇/m.test(llms.body) && ["/about", "/events", "/jobs"].every((p) => llms.body.includes(SITE_ORIGIN + p));
  const verification = await read("/naver58ded178a26f37d0e045fd7270dcc8cb.html");
  verification.row.checks.verificationFile = verification.body.trim() === "naver-site-verification: naver58ded178a26f37d0e045fd7270dcc8cb.html";

  const sitemap = await read("/sitemap.xml");
  const locs = (xml: string) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => decode(m[1]));
  sitemap.row.checks.index = /<sitemapindex\b/.test(sitemap.body) && locs(sitemap.body).length > 0;
  const urls: string[] = [];
  for (const loc of locs(sitemap.body)) {
    const url = new URL(loc);
    if (url.origin !== SITE_ORIGIN || !/^\/sitemap-[\w-]+\.xml$/.test(url.pathname)) {
      sitemap.row.checks.trustedLocations = false;
      continue;
    }
    const part = await read(url.pathname);
    const entries = locs(part.body);
    part.row.urlCount = entries.length;
    part.row.checks.urlset = /<urlset\b/.test(part.body) && entries.length > 0;
    part.row.checks.limits = entries.length <= 50_000 && Buffer.byteLength(part.body) <= 50 * 1024 * 1024;
    part.row.checks.canonicalLocations = entries.every((entry) => {
      const parsed = new URL(entry);
      return parsed.origin === SITE_ORIGIN && !parsed.search && !parsed.hash;
    });
    urls.push(...entries);
  }
  sitemap.row.checks.aboutIncluded = urls.includes(`${SITE_ORIGIN}/about`);
  sitemap.row.checks.uniqueUrls = new Set(urls).size === urls.length;
  for (const section of ["events", "jobs"]) {
    const sample = urls.find((url) => new RegExp(`/${section}/\\d+$`).test(url));
    if (sample) await page(new URL(sample).pathname, true, ["BreadcrumbList"]);
  }
  const failures = rows.flatMap((row) => Object.entries(row.checks).filter(([, pass]) => !pass).map(([check]) => `${row.path}: ${check}`));
  const report = { measuredAt: new Date().toISOString(), baseUrl: base.origin, canonicalOrigin: SITE_ORIGIN, userAgent,
    scope: "HTTP response sample; not search rankings, full-site coverage, or a structured-data eligibility validator",
    summary: { requests: rows.length, sitemapUrls: urls.length, failedChecks: failures.length }, failures, rows };
  if (values.output) {
    await mkdir(dirname(values.output), { recursive: true });
    await writeFile(values.output, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(values.output ? { ...report.summary, output: values.output, failures } : report, null, 2));
  if (failures.length) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
