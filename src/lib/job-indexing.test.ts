import assert from "node:assert/strict";
import { test } from "node:test";
import { assertJobNotificationPage, getJobNotifications, publishJobNotifications } from "./job-indexing";

const url = "https://www.dutyit.net/jobs/6522";
const [notification] = getJobNotifications([url], "URL_UPDATED");
const canonical = `<link rel="canonical" href="${url}">`;

test("indexing plans deduplicate and accept only canonical DuIt job details", () => {
  assert.equal(getJobNotifications([url, url], "URL_UPDATED").length, 1);
  for (const target of ["https://www.dutyit.net/events/1", "https://www.dutyit.net/jobs", `${url}?utm_source=x`, `${url}#job`, "https://dutyit.net/jobs/6522", "https://attacker.example/jobs/1", "https://www.dutyit.net/jobs/06522"]) {
    assert.throws(() => getJobNotifications([target], "URL_UPDATED"));
  }
  assert.throws(() => getJobNotifications([], "URL_UPDATED"));
  assert.throws(() => getJobNotifications([url], "INVALID"));
});

test("only deployed structured jobs or retained noindex jobs can be updated; deletion requires 404/410", () => {
  assert.doesNotThrow(() => assertJobNotificationPage(notification, 200, `${canonical}<script type="application/ld+json">[{"@type":"JobPosting"}]</script>`));
  assert.doesNotThrow(() => assertJobNotificationPage(notification, 200, `${canonical}<meta content="noindex, follow" name="robots">`));
  assert.throws(() => assertJobNotificationPage(notification, 200, `${canonical}<p>JobPosting</p>`));
  assert.throws(() => assertJobNotificationPage(notification, 302, ""));
  assert.throws(() => assertJobNotificationPage(notification, 200, '<meta name="robots" content="noindex">'));
  assert.doesNotThrow(() => assertJobNotificationPage({ ...notification, type: "URL_DELETED" }, 404, ""));
  assert.throws(() => assertJobNotificationPage({ ...notification, type: "URL_DELETED" }, 200, canonical));
});

test("a failed page preflight prevents all external indexing submissions", async () => {
  const calls: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    calls.push(String(input));
    return new Response("upstream error", { status: 503 });
  };
  await assert.rejects(publishJobNotifications([notification], "test-token", fetcher));
  assert.deepEqual(calls, [url]);
});

test("publishing checks every page first and sends credentials only to Google's indexing endpoint", async (t) => {
  t.mock.method(console, "info", () => {});
  const plan = getJobNotifications([url, "https://www.dutyit.net/jobs/6523"], "URL_UPDATED");
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return init?.method === "POST" ? Response.json({}) : new Response(`<link rel="canonical" href="${input}"><script type="application/ld+json">{"@type":"JobPosting"}</script>`);
  };
  await publishJobNotifications(plan, "test-token", fetcher);
  assert.deepEqual(calls.slice(0, 2).map((call) => call.url), plan.map((item) => item.url));
  assert.ok(calls.slice(0, 2).every((call) => call.init?.headers === undefined));
  for (const [index, call] of calls.slice(2).entries()) {
    assert.equal(call.url, "https://indexing.googleapis.com/v3/urlNotifications:publish");
    assert.equal(new Headers(call.init?.headers).get("Authorization"), "Bearer test-token");
    assert.deepEqual(JSON.parse(String(call.init?.body)), plan[index]);
  }
});
