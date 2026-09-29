import assert from "node:assert/strict";
import test from "node:test";
import { getJobCareerSummary, getJobClosingLabel, getJobLocationSummary, getJobSalarySummary } from "./job-list-summary";

test("job location summaries remove postal codes and streets without guessing unknown locations", () => {
    assert.equal(getJobLocationSummary("(16914)  경기도 용인시 기흥구 구성1로 20"), "경기 용인시");
    assert.equal(getJobLocationSummary("(06100) 서울특별시 강남구 테헤란로 1"), "서울 강남구");
    assert.equal(getJobLocationSummary("(30000) 세종특별자치시 한누리대로 1"), "세종");
    assert.equal(getJobLocationSummary("전국 재택"), "전국 재택");
    assert.equal(getJobLocationSummary("경기 용인시 기흥구 구성1로 20"), "경기 용인시");
    assert.equal(getJobLocationSummary("새지역특별시 가나구 도로명 12"), "새지역특별시 가나구");
    assert.equal(getJobLocationSummary(""), "근무지 미정");
});

test("salary summaries preserve units, exact amounts, ranges and negotiation conditions", () => {
    assert.equal(getJobSalarySummary("월급2,230,000원 이상,"), "월 223만원 이상");
    assert.equal(getJobSalarySummary("연봉25,930,000원 이상 ~ 40,520,000원 이하,"), "연 2,593~4,052만원");
    assert.equal(getJobSalarySummary("월급2,290,000원 이상 ~ 2,290,000원 이하,"), "월 229만원");
    assert.equal(getJobSalarySummary("시급35,000원 이상 ~ 45,000원 이하,"), "시 35,000~45,000원");
    assert.equal(getJobSalarySummary("월급3,300,001원 이상, 면접 후 재조정 가능"), "월 330.0001만원 이상, 면접 후 재조정 가능");
    assert.equal(getJobSalarySummary("회사 내규에 따름"), "회사 내규에 따름");
    assert.equal(getJobSalarySummary(""), "급여 정보 미등록");
});

test("career summaries distinguish preferences, requirements and missing information", () => {
    assert.equal(getJobCareerSummary("관계없음"), "경력무관");
    assert.equal(getJobCareerSummary("경력 (최소2년) 필수"), "경력 2년 이상 필수");
    assert.equal(getJobCareerSummary("경력 (6개월 이상) 우대"), "경력 6개월 이상 우대");
    assert.equal(getJobCareerSummary(""), "경력 정보 미등록");
});

test("one closing label covers deadlines, open-ended hiring and closed postings", () => {
    const job = { isActive: true, receiptCloseDt: "20260926", expiresAt: "" };
    const today = new Date("2026-09-26T12:00:00+09:00");
    assert.equal(getJobClosingLabel(job, today), "D-Day");
    assert.equal(getJobClosingLabel({ ...job, receiptCloseDt: "20261001" }, today), "D-5");
    assert.equal(getJobClosingLabel({ ...job, receiptCloseDt: "채용시까지" }, today), "채용 시 마감");
    assert.equal(getJobClosingLabel({ ...job, receiptCloseDt: "상시모집" }, today), "상시 채용");
    assert.equal(getJobClosingLabel({ ...job, receiptCloseDt: "" }, today), "마감일 미정");
    assert.equal(getJobClosingLabel({ ...job, isActive: false }, today), "마감");
    assert.equal(getJobClosingLabel({ ...job, receiptCloseDt: "20260925" }, today), "마감");
});
