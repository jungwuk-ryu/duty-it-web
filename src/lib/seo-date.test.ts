import assert from "node:assert/strict";
import { test } from "node:test";
import { getIsoDateTime, getKoreanDate, getLastModified, parseJobDeadlineDate } from "./seo-date";

test("API LocalDateTime uses Korea time on any server, including nanoseconds", () => {
  assert.equal(getIsoDateTime("2026-09-11T12:00:53.456691"), "2026-09-11T03:00:53.456Z");
  assert.equal(getIsoDateTime("2026-09-11T12:00:53+09:00"), "2026-09-11T03:00:53.000Z");
  assert.equal(getKoreanDate("2026-09-10T15:00:00Z"), "2026-09-11");
});

test("invalid, missing and future timestamps never become a fabricated lastmod", () => {
  const now = new Date("2026-09-11T12:00:00Z");
  for (const date of ["", "2026-02-30", "2026-09-11T25:00:00", "2026-09-11T12:99:00", "tomorrow", "09/11/2026"]) {
    assert.equal(getIsoDateTime(date), null, date);
  }
  assert.equal(getLastModified([null, undefined, "", "2027-01-01"], now), undefined);
  assert.equal(getLastModified(["2026-09-10", "2026-09-11T10:00:00", "invalid"], now), "2026-09-11T01:00:00.000Z");
  assert.equal(parseJobDeadlineDate("20260914"), "2026-09-14");
  assert.equal(parseJobDeadlineDate("2026-09-14"), "2026-09-14");
  assert.equal(parseJobDeadlineDate("20260230"), null);
  assert.equal(parseJobDeadlineDate("채용시까지"), null);
});
