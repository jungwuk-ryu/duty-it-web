import { decode } from "html-entities";

export const GEO_AUDIT_AGENTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "Googlebot", "Bingbot"] as const;
export const GEO_PUBLIC_PATHS = ["/", "/about", "/events", "/jobs"] as const;
export const GEO_PRIVATE_PATHS = ["/login", "/bookmarks", "/notifications", "/submit-event"] as const;

export function parseAuditOrigin(value: string): URL {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("--base-url must be an HTTP(S) origin without credentials, path, query, or fragment.");
  }
  return url;
}

export function parseAuditId(value: string | undefined, option: string): string | undefined {
  if (value === undefined) return undefined;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`--${option} must be a positive safe integer without leading zeros.`);
  }
  return value;
}

function attrs(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)]
    .map((match) => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4])]));
}

function withoutNonContent(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
}

function textOnly(html: string): string {
  return decode(withoutNonContent(html).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function flattenLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenLd);
  if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    return [node, ...flattenLd(node["@graph"])];
  }
  return [];
}

function hasType(node: Record<string, unknown>, type: string): boolean {
  return [node["@type"]].flat().includes(type);
}

export type HtmlAuditOptions = {
  path: string; canonicalOrigin: string; agent: string; index?: boolean;
  xRobotsTag?: string | null; requiredTypes?: string[]; requireSourceAnchor?: boolean;
};

/** Inspect response HTML, never RSC strings. This is not a CSS/browser visibility or schema eligibility validator. */
export function inspectGeoHtml(rawHtml: string, options: HtmlAuditOptions) {
  const html = withoutNonContent(rawHtml);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] ?? "";
  const body = html.replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, "")
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, "");
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attrs(match[0]));
  const descriptions = metas.filter((meta) => meta.name?.toLowerCase() === "description").map((meta) => meta.content ?? "");
  const robotMetas = metas.filter((meta) => ["robots", options.agent.toLowerCase()].includes(meta.name?.toLowerCase()))
    .map((meta) => meta.content ?? "");
  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)].map((match) => textOnly(match[1]));
  const h1 = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map((match) => textOnly(match[1]));
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attrs(match[0]))
    .filter((link) => link.rel?.toLowerCase().split(/\s+/).includes("canonical")).map((link) => link.href ?? "");
  const visibleText = textOnly(body);
  // X-Robots-Tag can target another agent. Generic directives and matching sections apply here.
  let headerAgent = "";
  const headerDirectives = (options.xRobotsTag ?? "").split(",").flatMap((part) => {
    const scoped = part.trim().match(/^([\w-]+)\s*:\s*(.*)$/);
    if (scoped && !["max-snippet", "max-image-preview", "max-video-preview", "unavailable_after"].includes(scoped[1].toLowerCase())) {
      headerAgent = scoped[1].toLowerCase();
      part = scoped[2];
    }
    return !headerAgent || headerAgent === options.agent.toLowerCase() ? [part] : [];
  });
  const indexDirectives = [...robotMetas, ...headerDirectives]
    .flatMap((value) => value.split(",")).map((directive) => directive.trim().toLowerCase());
  const noindex = indexDirectives.some((directive) => directive === "noindex" || directive === "none");
  const snippetRestricted = indexDirectives.some((directive) => {
    if (directive === "nosnippet") return true;
    const maximum = directive.match(/^max-snippet\s*:\s*(-?\d+)$/);
    return maximum !== null && Number(maximum[1]) === 0;
  });
  const nodes: Record<string, unknown>[] = [];
  let jsonLdCount = 0;
  let validJsonLd = true;
  const jsonLdErrors: string[] = [];
  for (const match of rawHtml.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (attrs(match[1]).type?.toLowerCase() !== "application/ld+json") continue;
    jsonLdCount++;
    try {
      const value: unknown = JSON.parse(match[2]);
      if (value === null || typeof value !== "object") throw new Error("JSON-LD root must be an object or array.");
      nodes.push(...flattenLd(value));
    } catch (error) {
      validJsonLd = false;
      jsonLdErrors.push(error instanceof Error ? error.message : String(error));
    }
  }
  const structuredData = [...new Set(nodes.flatMap((node) => [node["@type"]].flat()).filter((type): type is string => typeof type === "string"))];
  const faqNodes = nodes.filter((node) => hasType(node, "FAQPage"));
  const faqMatchesHtml = faqNodes.every((faq) => Array.isArray(faq.mainEntity) && faq.mainEntity.length > 0 && faq.mainEntity.every((question: unknown) => {
    if (!question || typeof question !== "object") return false;
    const q = question as Record<string, unknown>;
    const answer = q.acceptedAnswer as Record<string, unknown> | undefined;
    if (typeof q.name !== "string" || typeof answer?.text !== "string") return false;
    const questionText = textOnly(q.name);
    const answerText = textOnly(answer.text);
    return !!questionText && !!answerText && visibleText.includes(questionText) && visibleText.includes(answerText);
  }));
  const sourceAnchors = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)].flatMap((match) => {
    const href = attrs(match[1]).href;
    const label = textOnly(match[2]);
    if (!href || !label || !/(?:원문|주최|출처|공식|고용24)/.test(label)) return [];
    try {
      const url = new URL(href);
      return /^https?:$/.test(url.protocol) && !url.username && !url.password && url.origin !== options.canonicalOrigin ? [{ href: url.href, label }] : [];
    } catch { return []; }
  });
  const checks: Record<string, boolean> = {
    title: titles.length === 1 && !!titles[0],
    description: descriptions.length === 1 && !!descriptions[0].trim(),
    indexPolicy: options.index === false ? noindex : !noindex,
    validJsonLd,
    faqMatchesHtml,
  };
  if (options.index !== false) {
    checks.h1 = h1.length === 1 && !!h1[0];
    checks.snippetEligible = !noindex && !snippetRestricted;
    // Absolute canonical URLs must remain production URLs when --base-url points to a local build.
    checks.canonical = false;
    if (canonicals.length === 1) {
      try {
        const canonical = new URL(canonicals[0]);
        checks.canonical = /^https?:$/.test(canonical.protocol) && !canonical.username && !canonical.password
          && canonical.href === new URL(options.path, options.canonicalOrigin).href;
      } catch { /* Invalid and relative canonicals remain failed checks. */ }
    }
    for (const type of options.requiredTypes ?? []) checks[`schema:${type}`] = structuredData.includes(type);
    if (options.requireSourceAnchor) checks.sourceAnchor = sourceAnchors.length > 0;
  }
  return {
    title: titles[0] ?? "", description: descriptions[0] ?? "", h1, canonicals,
    robots: robotMetas, noindex, snippetRestricted, bodyTextLength: visibleText.length,
    jsonLdCount, structuredData, jsonLdErrors, faqCount: faqNodes.length, sourceAnchors, checks,
    // Streaming metadata placement is diagnostic only; it does not fail the audit.
    metadataInHead: {
      title: /<title\b/i.test(head),
      description: [...head.matchAll(/<meta\b[^>]*>/gi)].some((match) => attrs(match[0]).name?.toLowerCase() === "description"),
      canonical: [...head.matchAll(/<link\b[^>]*>/gi)].some((match) => attrs(match[0]).rel?.toLowerCase().split(/\s+/).includes("canonical")),
    },
  };
}

type RobotsRule = { allow: boolean; path: string };
type RobotsGroup = { agents: string[]; rules: RobotsRule[]; hasDirective: boolean };
export type ParsedRobots = { groups: RobotsGroup[]; sitemaps: string[]; unsupported: string[] };

/** Bounded diagnostic parser: ASCII path prefixes, * wildcards, terminal $, longest match, Allow ties. */
export function parseAuditRobots(text: string): ParsedRobots {
  const result: ParsedRobots = { groups: [], sitemaps: [], unsupported: [] };
  let group: RobotsGroup | undefined;
  for (const [index, rawLine] of text.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const match = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!match) { result.unsupported.push(`line ${index + 1}: malformed directive`); continue; }
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "sitemap") { result.sitemaps.push(value); continue; }
    if (key === "user-agent") {
      if (!/^(?:\*|[a-z_-]+)$/i.test(value)) result.unsupported.push(`line ${index + 1}: unsupported user-agent token`);
      if (!group || group.hasDirective) {
        group = { agents: [], rules: [], hasDirective: false };
        result.groups.push(group);
      }
      group.agents.push(value.toLowerCase());
    } else if (key === "allow" || key === "disallow") {
      if (!group) { result.unsupported.push(`line ${index + 1}: rule without user-agent`); continue; }
      group.hasDirective = true;
      if (!value) continue;
      if (!value.startsWith("/") || /[^\x21-\x7e]|%|\$(?!$)/.test(value)) {
        result.unsupported.push(`line ${index + 1}: unsupported path encoding or pattern`);
        continue;
      }
      group.rules.push({ allow: key === "allow", path: value });
    } else if (key === "crawl-delay" || key === "host") {
      // Not access rules. Keep the boundary so the next User-agent starts a new group.
      if (group) group.hasDirective = true;
    } else {
      result.unsupported.push(`line ${index + 1}: unsupported ${key} directive`);
      if (group) group.hasDirective = true;
    }
  }
  return result;
}

function robotsAllows(groups: RobotsGroup[], path: string): boolean {
  const matches = groups.flatMap((group) => group.rules).filter((rule) => {
    const terminal = rule.path.endsWith("$");
    const pattern = (terminal ? rule.path.slice(0, -1) : rule.path).split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
    return new RegExp(`^${pattern}${terminal ? "$" : ""}`).test(path);
  });
  if (!matches.length) return true;
  const specificity = (rule: RobotsRule) => rule.path.replace(/[*$]/g, "").length;
  const longest = Math.max(...matches.map(specificity));
  return matches.some((rule) => specificity(rule) === longest && rule.allow);
}

export function inspectRobotAccess(parsed: ParsedRobots, agent: string, publicPaths: readonly string[]) {
  const wildcard = parsed.groups.filter((group) => group.agents.includes("*"));
  const candidates = parsed.groups.map((group) => ({ group, length: Math.max(0, ...group.agents
    .filter((token) => token !== "*" && agent.toLowerCase().includes(token)).map((token) => token.length)) }));
  const longest = Math.max(0, ...candidates.map((candidate) => candidate.length));
  const selected = longest ? candidates.filter((candidate) => candidate.length === longest).map((candidate) => candidate.group) : wildcard;
  const apiProbe = "/api/geo-audit-probe";
  const wildcardBlocksApi = !robotsAllows(wildcard, apiProbe);
  const apiBlocked = !robotsAllows(selected, apiProbe);
  return {
    agent, selectedAgents: selected.map((group) => group.agents),
    wildcardIgnored: longest > 0 && wildcard.length > 0,
    wildcardBlocksApi, lostWildcardApiProtection: longest > 0 && wildcardBlocksApi && !apiBlocked,
    publicPaths: Object.fromEntries(publicPaths.map((path) => [path, robotsAllows(selected, path)])),
    checks: {
      supportedAccessSyntax: parsed.unsupported.length === 0,
      groupPresent: selected.length > 0,
      publicAllowed: publicPaths.every((path) => robotsAllows(selected, path)),
      apiExcluded: apiBlocked,
    },
  };
}

export function inspectSitemapLocations(xml: string, canonicalOrigin: string) {
  const cleanXml = xml.replace(/<!--[\s\S]*?-->/g, "");
  const locations = [...cleanXml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)].map((match) => decode(match[1].trim()));
  const index = /<sitemapindex\b/i.test(cleanXml);
  const urlset = /<urlset\b/i.test(cleanXml);
  const invalidLocations = locations.filter((location) => {
    try {
      const url = new URL(location);
      return url.origin !== canonicalOrigin || !!url.username || !!url.password || !!url.search || !!url.hash
        || location !== url.href || (index && !/^\/sitemap-[\w-]+\.xml$/.test(url.pathname));
    } catch { return true; }
  });
  return { locations, index, urlset, invalidLocations, checks: {
    documentShape: index !== urlset,
    locationsPresent: locations.length > 0,
    trustedCanonicalLocations: invalidLocations.length === 0,
    uniqueLocations: new Set(locations).size === locations.length,
  } };
}
