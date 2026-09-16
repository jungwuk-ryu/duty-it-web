import assert from "node:assert/strict";
import { test } from "node:test";
import { getJobMetadataDescription, getJobStructuredData } from "./job-seo";
import { getJobDday, getJobValidThrough, isJobOpen } from "./jobs";
import { JobPostingSchema } from "./schemas/job";
import { serializeJsonLd } from "./seo";

const now = new Date("2026-09-11T03:00:00Z");
const job = JobPostingSchema.parse({
  id: 6522, isActive: true, wantedAuthNo: "K123456",
  company: { id: 1, corpNm: "테스트병원", corpAddr: "다른 본사 주소", homePg: "https://example.com" },
  jobsNm: "간호사(304000)", wantedTitle: "병동 간호사 채용", jobCont: "간호 업무\n환자 돌봄",
  workRegion: "(44698) 울산광역시 남구 삼산중로 132", empTpNm: "기간의 정함이 있는 근로계약", empTpCd: "20",
  enterTpNm: "경력 1년 이상", eduNm: "학사", certificate: "간호사", rcptMthd: "온라인", submitDoc: "이력서",
  salTpNm: "월급 300만원 이상", workdayWorkhrCont: "주 5일 근무", fourIns: "국민연금",
  dtlRecrContUrl: "https://www.work24.go.kr/wk/a/b/1570/empDetailView.do?wantedAuthNo=K123456",
  postedAt: "2026-09-08T00:00:00", createdAt: "2026-09-10T12:00:00", updatedAt: "2026-09-11T10:00:00",
  receiptCloseDt: "20260914", expiresAt: "2026-09-14T00:00:00",
});

test("JobPosting uses original date, employer, actual worksite, full visible content and source identifier", () => {
  const data = getJobStructuredData(job, now)!;
  assert.equal(data["@type"], "JobPosting");
  assert.equal(data.title, "간호사");
  assert.equal(data.datePosted, "2026-09-07T15:00:00.000Z");
  assert.equal(data.hiringOrganization.name, "테스트병원");
  assert.equal(data.jobLocation.address.streetAddress, "남구 삼산중로 132");
  assert.equal(data.jobLocation.address.postalCode, "44698");
  assert.equal(data.jobLocation.address.addressCountry, "KR");
  assert.deepEqual(data.employmentType, ["TEMPORARY"]);
  assert.match(data.description, /환자 돌봄/);
  for (const text of ["주 5일", "간호사", "학사", "이력서", "국민연금", "월급 300만원"]) assert.ok(data.description.includes(text));
  assert.equal(data.validThrough, "2026-09-14T23:59:59+09:00");
  assert.equal(data.directApply, false);
  assert.ok(!("baseSalary" in data));
  assert.match(getJobMetadataDescription(job), /테스트병원.*울산광역시.*경력 1년.*고용 형태.*접수 마감/);
});

test("date-only deadline stays open through the Korean closing day even if the API flag is stale", () => {
  assert.equal(isJobOpen(job, new Date("2026-09-14T23:59:58+09:00")), true);
  assert.equal(isJobOpen(job, new Date("2026-09-15T00:00:00+09:00")), false);
  assert.equal(getJobStructuredData(job, new Date("2026-09-15T00:00:00+09:00")), null);
  assert.equal(getJobStructuredData({ ...job, isActive: false }, now), null);
  assert.equal(getJobDday("2026-09-14", now), "D-3");
});

test("open-ended jobs do not invent an expiry and missing facts do not produce invalid JobPosting", () => {
  const ongoing = { ...job, receiptCloseDt: "채용시까지", expiresAt: "" };
  assert.equal(getJobValidThrough(ongoing), null);
  assert.ok(!("validThrough" in getJobStructuredData(ongoing, now)!));
  for (const patch of [{ postedAt: "" }, { postedAt: "bad-date" }, { postedAt: "2027-01-01" }, { workRegion: "" }, { jobCont: "" }, { dtlRecrContUrl: "javascript:alert(1)" }]) {
    assert.equal(getJobStructuredData({ ...job, ...patch }, now), null);
  }
  assert.equal(getJobStructuredData({ ...job, company: { ...job.company, corpNm: "" } }, now), null);
});

test("job text cannot inject HTML into structured descriptions or close JSON-LD script tags", () => {
  const data = getJobStructuredData({ ...job, jobCont: '</script><img src=x onerror="alert(1)"> & 업무' }, now)!;
  assert.match(data.description, /&lt;\/script&gt;/);
  assert.doesNotMatch(data.description, /<img/);
  assert.doesNotMatch(serializeJsonLd(data), /</);
});
