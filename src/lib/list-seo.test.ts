import assert from "node:assert/strict";
import { test } from "node:test";
import { getEventsListMetadata, getJobsListMetadata } from "./list-seo";

test("default pagination has its own canonical and remains indexable", () => {
  for (const [section, metadata] of [["events", getEventsListMetadata({ cursor: "next+/=" })], ["jobs", getJobsListMetadata({ cursor: "next+/=" })]] as const) {
    assert.equal(metadata.alternates?.canonical, `https://www.dutyit.net/${section}?cursor=next%2B%2F%3D`);
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    assert.equal(metadata.openGraph?.url, metadata.alternates?.canonical);
    assert.ok(metadata.description);
    assert.ok(metadata.twitter);
  }
});

test("presentation and default values collapse to the base URL", () => {
  assert.equal(getEventsListMetadata({ view: "list", field: "CREATED_AT", statusGroup: "ACTIVE", types: "invalid" }).alternates?.canonical, "https://www.dutyit.net/events");
  assert.equal(getJobsListMetadata({ region: "invalid", cursor: " " }).alternates?.canonical, "https://www.dutyit.net/jobs");
});

test("filters, searches and alternate sorts are noindex,follow without collapsing different content to page one", () => {
  for (const params of [{ searchKeyword: "간호" }, { hostId: "42" }, { types: "SEMINAR" }, { field: "VIEW_COUNT" }, { statusGroup: "FINISHED" }]) {
    const data = getEventsListMetadata({ ...params, cursor: "next" });
    assert.deepEqual(data.robots, { index: false, follow: true });
    assert.match(String(data.alternates?.canonical), /cursor=next/);
  }
  for (const params of [{ q: "병원" }, { region: "SEOUL" }, { employmentType: "FULL_TIME" }, { closeType: "ONGOING" }]) {
    const data = getJobsListMetadata({ ...params, cursor: "next" });
    assert.deepEqual(data.robots, { index: false, follow: true });
    assert.match(String(data.alternates?.canonical), /cursor=next/);
  }
  assert.equal(getEventsListMetadata({ types: ["SEMINAR", "CONFERENCE", "SEMINAR"] }).alternates?.canonical, "https://www.dutyit.net/events?types=CONFERENCE%2CSEMINAR");
});
