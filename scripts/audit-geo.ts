import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";
import { SITE_ORIGIN } from "../src/lib/seo";
import {
  GEO_AUDIT_AGENTS, GEO_PRIVATE_PATHS, GEO_PUBLIC_PATHS, inspectGeoHtml,
  inspectRobotAccess, inspectSitemapLocations, parseAuditId, parseAuditOrigin, parseAuditRobots,
} from "../src/lib/geo-audit";

type Row = {
  path: string; agent: string; status?: number; contentType?: string; location?: string | null;
  xRobotsTag?: string | null; checks: Record<string, boolean>; error?: string;
  html?: ReturnType<typeof inspectGeoHtml>;
  robots?: { unsupported: string[]; sitemaps: string[]; agents: ReturnType<typeof inspectRobotAccess>[] };
  sitemap?: ReturnType<typeof inspectSitemapLocations>;
};

async function main() {
  const { values } = parseArgs({ options: {
    "base-url": { type: "string", default: SITE_ORIGIN }, output: { type: "string" },
    "event-id": { type: "string" }, "job-id": { type: "string" },
  } });
  const base = parseAuditOrigin(values["base-url"]!);
  const eventId = parseAuditId(values["event-id"], "event-id");
  const jobId = parseAuditId(values["job-id"], "job-id");
  const paths: string[] = [...GEO_PUBLIC_PATHS, ...(eventId ? [`/events/${eventId}`] : []), ...(jobId ? [`/jobs/${jobId}`] : [])];
  const rows: Row[] = [];
  const defaultAgent = "DutyitGEOAudit/1.0";
  const startedAt = new Date().toISOString();
  const timeoutMs = 20_000;
  const requestDelayMs = 250;
  async function read(path: string, agent = defaultAgent) {
    if (rows.length) await delay(requestDelayMs);
    const row: Row = { path, agent, checks: {} };
    rows.push(row);
    try {
      // GET only. No login, JavaScript execution, API keys, model calls, or redirect following.
      const response = await fetch(new URL(path, base), {
        method: "GET", redirect: "manual", signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": agent },
      });
      row.status = response.status;
      row.contentType = response.headers.get("content-type") ?? "";
      row.location = response.headers.get("location");
      row.xRobotsTag = response.headers.get("x-robots-tag");
      row.checks.status200 = response.status === 200;
      return { row, body: await response.text() };
    } catch (error) {
      row.checks.response = false;
      row.error = error instanceof Error ? error.message : String(error);
      return { row, body: "" };
    }
  }

  // Sequential requests with a gap also keep the six User-Agent samples comparable.
  for (const path of paths) {
    for (const agent of GEO_AUDIT_AGENTS) {
      const { row, body } = await read(path, agent);
      row.checks.htmlContentType = row.contentType?.includes("text/html") ?? false;
      const detail = /^\/(?:events|jobs)\/\d+$/.test(path);
      row.html = inspectGeoHtml(body, {
        path, canonicalOrigin: SITE_ORIGIN, agent, xRobotsTag: row.xRobotsTag,
        requiredTypes: path === "/" ? ["WebSite", "Organization"] : path === "/about" ? ["AboutPage", "FAQPage"] : detail ? ["BreadcrumbList"] : [],
        requireSourceAnchor: detail,
      });
      Object.assign(row.checks, row.html.checks);
    }
  }
  for (const path of GEO_PRIVATE_PATHS) {
    const { row, body } = await read(path);
    row.checks.htmlContentType = row.contentType?.includes("text/html") ?? false;
    row.html = inspectGeoHtml(body, { path, canonicalOrigin: SITE_ORIGIN, agent: defaultAgent, index: false, xRobotsTag: row.xRobotsTag });
    Object.assign(row.checks, row.html.checks);
  }
  const robots = await read("/robots.txt");
  const parsed = parseAuditRobots(robots.body);
  robots.row.checks.plainText = robots.row.contentType?.includes("text/plain") ?? false;
  robots.row.checks.sitemapDeclared = parsed.sitemaps.includes(`${SITE_ORIGIN}/sitemap.xml`);
  robots.row.checks.wildcardPresent = parsed.groups.some((group) => group.agents.includes("*"));
  const access = GEO_AUDIT_AGENTS.map((agent) => inspectRobotAccess(parsed, agent, paths));
  robots.row.robots = { unsupported: parsed.unsupported, sitemaps: parsed.sitemaps, agents: access };
  for (const agent of access) for (const [check, pass] of Object.entries(agent.checks)) robots.row.checks[`${agent.agent}:${check}`] = pass;

  const sitemap = await read("/sitemap.xml");
  sitemap.row.sitemap = inspectSitemapLocations(sitemap.body, SITE_ORIGIN);
  Object.assign(sitemap.row.checks, sitemap.row.sitemap.checks);
  sitemap.row.checks.xmlContentType = /(?:application|text)\/xml/i.test(sitemap.row.contentType ?? "");
  const urls: string[] = sitemap.row.sitemap.urlset ? [...sitemap.row.sitemap.locations] : [];
  if (sitemap.row.sitemap.index) {
    const trusted = sitemap.row.sitemap.locations.filter((location) => !sitemap.row.sitemap!.invalidLocations.includes(location));
    // Bound traffic from unexpectedly large indexes. Do not claim an incomplete inspection passed.
    sitemap.row.checks.withinTenShardLimit = trusted.length <= 10;
    for (const location of [...new Set(trusted)].slice(0, 10)) {
      const part = await read(new URL(location).pathname);
      part.row.sitemap = inspectSitemapLocations(part.body, SITE_ORIGIN);
      Object.assign(part.row.checks, part.row.sitemap.checks);
      part.row.checks.urlset = part.row.sitemap.urlset && !part.row.sitemap.index;
      part.row.checks.xmlContentType = /(?:application|text)\/xml/i.test(part.row.contentType ?? "");
      urls.push(...part.row.sitemap.locations);
    }
  }
  sitemap.row.checks.publicPagesIncluded = GEO_PUBLIC_PATHS.every((path) => urls.includes(new URL(path, SITE_ORIGIN).href));
  sitemap.row.checks.uniqueAcrossShards = new Set(urls).size === urls.length;
  sitemap.row.checks.privateUrlsExcluded = urls.every((location) => {
    try {
      const path = new URL(location).pathname;
      return !path.startsWith("/api/") && !GEO_PRIVATE_PATHS.some((privatePath) => path === privatePath || path.startsWith(`${privatePath}/`));
    } catch { return false; }
  });
  const failures = rows.flatMap((row) => Object.entries(row.checks).filter(([, pass]) => !pass).map(([check]) => `${row.agent} ${row.path}: ${check}`));
  const report = {
    startedAt, completedAt: new Date().toISOString(), baseUrl: base.origin, canonicalOrigin: SITE_ORIGIN,
    scope: "Unauthenticated HTTP response samples using declared User-Agent strings. Not verified crawler IPs, search indexing, ranking, citations, or a schema eligibility test. No model API calls.",
    limitations: [
      "robots parser supports ASCII path prefixes, * wildcards and terminal $, longest matching agent/group/rule and Allow ties; unsupported syntax fails the checks. No percent-encoding normalization or vendor-specific access extensions.",
      "HTML checks exclude scripts, styles, templates, comments and head content from body text; they do not execute JavaScript or evaluate CSS visibility. Head metadata placement is diagnostic only.",
      "External source anchors are checked by HTTP(S) URL and a source-related label; their destination availability and factual accuracy are not checked.",
      "All requests are GET, sequential with 250ms gaps, 20s timeouts and manual redirects. Sitemaps are limited to 10 shards. The API exclusion probe is evaluated locally; no /api/ request is sent.",
    ],
    requestPolicy: { method: "GET", timeoutMs, requestDelayMs, redirect: "manual" },
    summary: { requests: rows.length, sitemapUrls: urls.length, failedChecks: failures.length }, failures, rows,
  };
  if (values.output) {
    await mkdir(dirname(values.output), { recursive: true });
    await writeFile(values.output, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(values.output ? { ...report.summary, output: values.output, failures } : report, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
