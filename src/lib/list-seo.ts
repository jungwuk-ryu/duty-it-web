import { getCursor, getEventFilters, getEventsSearchParams, type EventSearchParams } from "./event-query";
import { getJobCursor, getJobFilters, getJobsHref, type JobsSearchParams } from "./job-query";
import { getPageMetadata, SITE_ORIGIN } from "./seo";

export function getEventsListMetadata(params: EventSearchParams) {
  const filters = getEventFilters(params);
  const query = getEventsSearchParams(filters, getCursor(params));
  const url = `${SITE_ORIGIN}/events${query.size ? `?${query}` : ""}`;
  const index = !filters.searchKeyword && filters.hostId == null && filters.types.length === 0
    && filters.statusGroup === "ACTIVE" && filters.field === "CREATED_AT";
  return getPageMetadata({
    title: filters.searchKeyword ? `${filters.searchKeyword} 행사 검색 | 듀잇` : "간호 행사 목록 | 듀잇",
    description: "간호사와 간호대학생을 위한 학술대회, 세미나, 보수교육, 공모전, 봉사와 대외활동을 찾아보세요. 행사 일정, 주최기관과 신청 마감을 듀잇에서 확인하세요.",
    url, index,
  });
}

export function getJobsListMetadata(params: JobsSearchParams) {
  const filters = getJobFilters(params);
  return getPageMetadata({
    title: filters.searchKeyword ? `${filters.searchKeyword} 채용 공고 | 듀잇` : "간호 채용 공고 | 듀잇",
    description: "간호사 채용 공고를 지역, 고용 형태와 접수 마감 조건으로 찾아보세요. 채용기관, 직무, 급여와 지원 방법을 확인하고 고용24에서 지원할 수 있습니다.",
    url: `${SITE_ORIGIN}${getJobsHref(filters, getJobCursor(params))}`,
    index: !filters.searchKeyword && !filters.workRegion && !filters.employmentType && !filters.closeType,
  });
}
