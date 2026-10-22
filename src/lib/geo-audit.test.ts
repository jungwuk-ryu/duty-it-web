import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectGeoHtml, inspectRobotAccess, inspectSitemapLocations, parseAuditId, parseAuditOrigin, parseAuditRobots } from "./geo-audit";

const origin = "https://www.dutyit.net";
const options = { path: "/about", canonicalOrigin: origin, agent: "OAI-SearchBot" };
const metadata = '<title>듀잇 &amp; 이용 안내</title><meta name="description" content="듀잇 안내"><link rel="canonical" href="https://www.dutyit.net/about">';
const faq = { "@type": ["WebPage", "FAQPage"], mainEntity: [{ "@type": "Question", name: "어디서 찾나요?", acceptedAnswer: { "@type": "Answer", text: "행사 목록에서 찾아보세요." } }] };
const ld = `<script type="application/ld+json">${JSON.stringify(faq)}</script>`;

test("RSC, script, style, template and comment content cannot satisfy body or source checks", () => {
  const result = inspectGeoHtml(`<head>${metadata}</head><body><script>self.__next.push('<h1>fake</h1><a href="https://source.test/">원문</a>');</script><style>/* <h1>fake</h1> */</style><template><h1>fake</h1></template><!-- <h1>fake</h1> --></body>`, { ...options, requireSourceAnchor: true });
  assert.equal(result.checks.title, true);
  assert.equal(result.title, "듀잇 & 이용 안내");
  assert.equal(result.checks.h1, false);
  assert.equal(result.checks.sourceAnchor, false);
  assert.equal(result.bodyTextLength, 0);
});

test("FAQ text must be present in body, not only in metadata or its JSON-LD", () => {
  const absent = inspectGeoHtml(`<head>${metadata}<title>어디서 찾나요? 행사 목록에서 찾아보세요.</title></head><body><h1>소개</h1>${ld}</body>`, options);
  assert.equal(absent.checks.validJsonLd, true);
  assert.equal(absent.checks.faqMatchesHtml, false);
  const present = inspectGeoHtml(`<head>${metadata}</head><body><h1>소개</h1><h2>어디서 찾나요?</h2><p>행사 목록에서 찾아보세요.</p>${ld}</body>`, options);
  assert.equal(present.checks.faqMatchesHtml, true);
});

test("malformed FAQ nodes and JSON-LD return failed checks instead of crashing", () => {
  const malformed = inspectGeoHtml('<h1>소개</h1><script type="application/ld+json">{"@type":"FAQPage","mainEntity":[null]}</script><script type="application/ld+json">{</script>', options);
  assert.equal(malformed.checks.validJsonLd, false);
  assert.equal(malformed.checks.faqMatchesHtml, false);
  assert.equal(malformed.jsonLdErrors.length, 1);
});

test("streamed metadata is diagnosed without forcing a head-placement failure", () => {
  const result = inspectGeoHtml(`<head></head><body><h1>소개</h1>${metadata}</body>`, options);
  assert.equal(result.checks.title, true);
  assert.equal(result.checks.description, true);
  assert.equal(result.checks.canonical, true);
  assert.deepEqual(result.metadataInHead, { title: false, description: false, canonical: false });
  const duplicate = inspectGeoHtml(`${metadata}${metadata}<h1>소개</h1>`, options);
  assert.equal(duplicate.checks.title, false);
  assert.equal(duplicate.checks.canonical, false);
});

test("index policy respects agent-targeted robots and header scoping", () => {
  const html = `${metadata}<meta name="Googlebot" content="noindex"><h1>소개</h1>`;
  assert.equal(inspectGeoHtml(html, options).noindex, false);
  assert.equal(inspectGeoHtml(html, { ...options, agent: "Googlebot" }).noindex, true);
  assert.equal(inspectGeoHtml(metadata, { ...options, xRobotsTag: "googlebot: noindex, nofollow" }).noindex, false);
  assert.equal(inspectGeoHtml(metadata, { ...options, index: false, xRobotsTag: "noindex" }).checks.indexPolicy, true);
});

test("image-preview none is not a noindex directive in meta or response headers", () => {
  for (const extra of [
    { html: '<meta name="robots" content="index, max-image-preview: none">', headers: undefined },
    { html: "", headers: "index, max-image-preview:none" },
  ]) {
    const result = inspectGeoHtml(metadata + extra.html, { ...options, xRobotsTag: extra.headers });
    assert.equal(result.noindex, false);
    assert.equal(result.checks.indexPolicy, true);
    assert.equal(result.checks.snippetEligible, true);
  }
  for (const directive of [" NONE ", " NoIndex "]) {
    assert.equal(inspectGeoHtml(`<meta name="robots" content="max-image-preview:none,${directive}">`, options).noindex, true);
    assert.equal(inspectGeoHtml(metadata, { ...options, xRobotsTag: `max-image-preview:none,${directive}` }).noindex, true);
  }
});

test("root canonicals normalize a missing slash while refusing relative or untrusted URLs", () => {
  const result = inspectGeoHtml(`<link rel="canonical" href="${origin}">`, { ...options, path: "/" });
  assert.equal(result.checks.canonical, true);
  for (const href of ["/about", "https://attacker.test/about", "https://name@www.dutyit.net/about", "javascript:alert(1)"]) {
    assert.equal(inspectGeoHtml(`<link rel="canonical" href="${href}">`, options).checks.canonical, false);
  }
});

test("public snippet eligibility catches nosnippet and max-snippet zero without changing private noindex policy", () => {
  for (const value of ["index, nosnippet", "index, max-snippet: 0"]) {
    const result = inspectGeoHtml(`${metadata}<meta name="robots" content="${value}">`, options);
    assert.equal(result.checks.indexPolicy, true);
    assert.equal(result.checks.snippetEligible, false);
  }
  assert.equal(inspectGeoHtml(metadata, { ...options, xRobotsTag: "max-snippet:0" }).checks.snippetEligible, false);
  assert.equal(inspectGeoHtml(metadata, { ...options, xRobotsTag: "max-snippet:-1" }).checks.snippetEligible, true);
  const privatePage = inspectGeoHtml(metadata, { ...options, index: false, xRobotsTag: "noindex, nosnippet" });
  assert.equal(privatePage.checks.indexPolicy, true);
  assert.equal(privatePage.checks.snippetEligible, undefined);
});

test("source anchors require real external HTTP(S) links with source labels", () => {
  const result = inspectGeoHtml('<a href="javascript:alert(1)">원문</a><a href="/events">출처</a><a href="https://example.test/signup">신청하기</a><a href="https://work24.test/post?x=1&amp;y=2">고용24 원문 확인</a>', { ...options, requireSourceAnchor: true });
  assert.deepEqual(result.sourceAnchors, [{ href: "https://work24.test/post?x=1&y=2", label: "고용24 원문 확인" }]);
  assert.equal(result.checks.sourceAnchor, true);
});

test("a specific robots group cannot inherit wildcard API protection", () => {
  const parsed = parseAuditRobots("User-agent: *\nAllow: /\nDisallow: /api/\n\nUser-agent: OAI-SearchBot\nAllow: /\n");
  const search = inspectRobotAccess(parsed, "OAI-SearchBot", ["/", "/about"]);
  assert.equal(search.checks.publicAllowed, true);
  assert.equal(search.checks.apiExcluded, false);
  assert.equal(search.wildcardIgnored, true);
  assert.equal(search.lostWildcardApiProtection, true);
  const claude = inspectRobotAccess(parsed, "Claude-SearchBot", ["/", "/about"]);
  assert.equal(claude.checks.apiExcluded, true);
  assert.equal(claude.wildcardIgnored, false);
});

test("robots merges equally specific groups, supports wildcard rules and resolves Allow ties", () => {
  const parsed = parseAuditRobots("User-agent: *\nDisallow: /\nUser-agent: Claude-SearchBot\nUser-agent: Claude-User\nDisallow: /api/\nDisallow: /events*\nUser-agent: Claude-SearchBot\nAllow: /events$\n");
  const access = inspectRobotAccess(parsed, "Claude-SearchBot", ["/about", "/events", "/events/4"]);
  assert.deepEqual(access.publicPaths, { "/about": true, "/events": true, "/events/4": false });
  assert.equal(access.checks.apiExcluded, true);
  assert.equal(access.selectedAgents.length, 2);
});

test("unsupported robots encoding fails explicitly instead of reporting a clean pass", () => {
  const parsed = parseAuditRobots("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /%61bout\n");
  assert.equal(parsed.unsupported.length, 1);
  assert.equal(inspectRobotAccess(parsed, "Googlebot", ["/about"]).checks.supportedAccessSyntax, false);
});

test("sitemap refuses untrusted origins, credentials, queries and non-sitemap index paths", () => {
  const xml = '<sitemapindex><sitemap><loc>https://www.dutyit.net/sitemap-static-0.xml</loc></sitemap><sitemap><loc>https://evil.test/sitemap.xml</loc></sitemap><sitemap><loc>https://user@www.dutyit.net/sitemap-x.xml</loc></sitemap><sitemap><loc>https://www.dutyit.net/api/private</loc></sitemap><sitemap><loc>https://www.dutyit.net/sitemap-x.xml?q=1</loc></sitemap></sitemapindex>';
  const result = inspectSitemapLocations(xml, origin);
  assert.equal(result.invalidLocations.length, 4);
  assert.equal(result.checks.trustedCanonicalLocations, false);
  const valid = inspectSitemapLocations('<urlset><url><loc>https://www.dutyit.net/about</loc><image:image><image:loc>https://cdn.test/image.png</image:loc></image:image></url></urlset>', origin);
  assert.deepEqual(valid.locations, [`${origin}/about`]);
  assert.equal(valid.checks.trustedCanonicalLocations, true);
});

test("CLI inputs cannot add credentials, paths or injected detail requests", () => {
  assert.equal(parseAuditOrigin("http://localhost:3000").origin, "http://localhost:3000");
  for (const value of ["ftp://example.test", "https://name:secret@example.test", "https://example.test/about", "https://example.test/?q=1"]) {
    assert.throws(() => parseAuditOrigin(value));
  }
  assert.equal(parseAuditId("123", "event-id"), "123");
  assert.equal(parseAuditId(undefined, "event-id"), undefined);
  for (const value of ["0", "01", "-1", "../api", "1?delete=true", "9007199254740992"]) assert.throws(() => parseAuditId(value, "event-id"));
});
