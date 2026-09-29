import { getCursor, getEventFilters, getEventsSearchParams, type EventSearchParams } from "./event-query";
import { getJobCursor, getJobFilters, getJobsHref, type JobsSearchParams } from "./job-query";
import { getPageMetadata, SITE_ORIGIN } from "./seo";

export const EVENTS_PAGE_HEADING = "간호대학생·간호사 대외활동";
export const EVENTS_PAGE_DESCRIPTION = "간호대학생 대외활동과 간호사 참여 행사를 찾아보세요. 봉사·서포터즈·공모전부터 학술대회·교육까지, 주최기관과 모집 기간을 확인하고 관심 활동을 북마크하세요.";

export function getEventsListMetadata(params: EventSearchParams) {
  const filters = getEventFilters(params);
  const query = getEventsSearchParams(filters, getCursor(params));
  const url = `${SITE_ORIGIN}/events${query.size ? `?${query}` : ""}`;
  const index = !filters.searchKeyword && filters.hostId == null && filters.types.length === 0
    && filters.statusGroup === "ACTIVE" && filters.field === "CREATED_AT";
  return getPageMetadata({
    title: filters.searchKeyword ? `${filters.searchKeyword} 대외활동·행사 검색 | 듀잇` : `${EVENTS_PAGE_HEADING} | 봉사·서포터즈·공모전 | 듀잇`,
    description: EVENTS_PAGE_DESCRIPTION,
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
