import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ANDROID_APP_PACKAGE, getAppPlatform, getEventAppLinks, getEventAppMetadata, IOS_APP_ID } from "./event-app-links";

test("Android intent opens the selected event and falls back to the same web detail", () => {
  const { webUrl, webFallbackUrl, universalUrl, iosUrl, androidUrl } = getEventAppLinks(811);
  assert.equal(webUrl, "https://www.dutyit.net/events/811");
  assert.equal(iosUrl, "dutyit://events/811");
  assert.ok(androidUrl.startsWith("intent://www.dutyit.net/events/811#Intent;scheme=https;"));
  assert.ok(androidUrl.includes(`package=${ANDROID_APP_PACKAGE};`));
  const fallback = /S\.browser_fallback_url=([^;]+);/.exec(androidUrl)?.[1];
  assert.equal(decodeURIComponent(fallback!), webFallbackUrl);
  assert.equal(webFallbackUrl, "https://www.dutyit.net/events/811?openIn=web");
  assert.equal(universalUrl, "https://www.dutyit.net/visitEvent/811?openIn=app");
});

test("mobile platform detection covers iPhone, Android, and desktop-mode iPad without targeting desktop browsers", () => {
  assert.equal(getAppPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), "ios");
  assert.equal(getAppPlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9)"), "android");
  assert.equal(getAppPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 5), "ios");
  assert.equal(getAppPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 0), null);
  assert.equal(getAppPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 10), null);
});

test("Safari banner and social app metadata carry the event destination", () => {
  const metadata = getEventAppMetadata(811);
  assert.deepEqual(metadata.itunes, { appId: IOS_APP_ID, appArgument: "https://www.dutyit.net/visitEvent/811?openIn=app" });
  assert.deepEqual(metadata.appLinks?.ios, { url: "dutyit://events/811", app_store_id: IOS_APP_ID, app_name: "듀잇" });
  assert.deepEqual(metadata.appLinks?.android, { url: "https://www.dutyit.net/events/811", package: ANDROID_APP_PACKAGE, app_name: "듀잇" });
  assert.deepEqual(metadata.appLinks?.web, { url: "https://www.dutyit.net/events/811", should_fallback: true });
});

test("iOS association accepts event detail links alongside the existing visitEvent links", () => {
  const association = JSON.parse(readFileSync(new URL("../../public/.well-known/apple-app-site-association", import.meta.url), "utf8"));
  const app = association.applinks.details.find((item: { appID: string }) => item.appID === "M3CULMDKU3.com.dutyit.app");
  assert.ok(app.paths.includes("/events/*"));
  assert.ok(app.paths.includes("/visitEvent/*"));
  assert.ok(!app.paths.includes("*"));
});
