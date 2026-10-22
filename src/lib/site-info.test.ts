import assert from "node:assert/strict";
import { test } from "node:test";
import { SITE_ORIGIN } from "./seo";
import { getAboutStructuredData, getLlmsText, SERVICE_FAQS } from "./site-info";

type StructuredQuestion = NonNullable<ReturnType<typeof getAboutStructuredData>["@graph"][number]["mainEntity"]>[number];

test("published FAQ permalinks remain stable and unique", () => {
  // These fragments are public links: editing or reordering copy must not rename them.
  const publishedIds = [
    "faq-browse-without-login",
    "faq-find-events",
    "faq-apply-jobs",
    "faq-save-bookmarks",
    "faq-save-calendar",
    "faq-event-subscriptions",
    "faq-submit-event",
  ];
  const ids = SERVICE_FAQS.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length);
  for (const id of publishedIds) assert.ok(ids.includes(id), `Missing published FAQ: ${id}`);
  for (const id of ids) assert.match(id, /^faq-[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test("FAQ structured data and text index describe the same answers at distinct public anchors", () => {
  const graph = getAboutStructuredData()["@graph"];
  const faqPage = graph.find((entry) => entry["@type"] === "FAQPage");
  const questions = faqPage?.mainEntity;
  const text = getLlmsText();

  assert.ok(questions);
  assert.equal(questions.length, SERVICE_FAQS.length);
  const entityIds = new Set<string>();

  for (const { id, question, answer } of SERVICE_FAQS) {
    const questionUrl = `${SITE_ORIGIN}/about#${id}`;
    const answerUrl = `${SITE_ORIGIN}/about#${id}-answer`;
    const entry: StructuredQuestion | undefined = questions.find((item) => item["@id"] === questionUrl);

    assert.ok(entry, `Missing structured question: ${id}`);
    assert.equal(entry.url, questionUrl);
    assert.equal(entry.name, question);
    assert.equal(entry.acceptedAnswer["@id"], answerUrl);
    assert.equal(entry.acceptedAnswer.url, answerUrl);
    assert.equal(entry.acceptedAnswer.text, answer);
    assert.ok(text.includes(`[${question}](${questionUrl})\n${answer}`));

    for (const url of [questionUrl, answerUrl]) {
      assert.equal(entityIds.has(url), false, `Duplicate entity identity: ${url}`);
      entityIds.add(url);
    }
  }
});
