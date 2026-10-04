import assert from "node:assert/strict";
import { test } from "node:test";
import { createEventAppLauncher } from "./event-app-launch";

function browser(userAgent = "iPhone") {
  const opened: string[] = [];
  return {
    opened,
    navigator: { userAgent, maxTouchPoints: 0 },
    document: { visibilityState: "visible" as DocumentVisibilityState },
    location: { search: "", assign: (url: string | URL) => { opened.push(String(url)); } },
  };
}

test("an iOS detail opens its app once across remounts and app returns", () => {
  const launch = createEventAppLauncher();
  const page = browser();
  assert.equal(launch(811, true, page), true);
  assert.equal(launch(811, true, page), false);
  assert.equal(launch(811, true, page), false);
  assert.deepEqual(page.opened, ["dutyit://events/811"]);
  assert.equal(launch(812, true, page), true);
  assert.equal(page.opened[1], "dutyit://events/812");
});

test("a card tap suppresses the automatic echo but another tap can retry", () => {
  const launch = createEventAppLauncher();
  const page = browser();
  launch(811, false, page);
  launch(811, true, page);
  launch(811, false, page);
  assert.deepEqual(page.opened, ["dutyit://events/811", "dutyit://events/811"]);
});

test("a web fallback never automatically relaunches, while the app button remains usable", () => {
  const launch = createEventAppLauncher();
  const page = browser("Android");
  page.location.search = "?openIn=web";
  assert.equal(launch(811, true, page), false);
  assert.equal(launch(811, false, page), true);
  assert.match(page.opened[0], /^intent:\/\/www\.dutyit\.net\/events\/811#Intent;/);
  assert.ok(page.opened[0].includes(encodeURIComponent("https://www.dutyit.net/events/811?openIn=web")));
});

test("desktop, server render, and background tabs do not launch an app", () => {
  const launch = createEventAppLauncher();
  const desktop = browser("Windows NT 10.0");
  assert.equal(launch(811, true), false);
  assert.equal(launch(811, true, desktop), false);
  const page = browser();
  page.document.visibilityState = "hidden";
  assert.equal(launch(811, true, page), false);
  page.document.visibilityState = "visible";
  assert.equal(launch(811, true, page), true);
  assert.equal(desktop.opened.length, 0);
});

test("browser rejection leaves the web usable without a repeated automatic prompt", () => {
  const launch = createEventAppLauncher();
  const page = browser();
  page.location.assign = () => { throw new Error("External protocol refused"); };
  assert.equal(launch(811, true, page), false);
  assert.equal(launch(811, true, page), false);
});
