import JobFiltersForm from "@/src/components/JobFiltersForm";
import JobPostingCard from "@/src/components/ui/JobPostingCard";
import { buttonVariants } from "@/src/components/ui/button";
import {
    fetchJobPostings,
    JOB_CLOSE_TYPES,
    JOB_EMPLOYMENT_TYPES,
    JOB_WORK_REGIONS,
    JobCloseType,
    JobEmploymentType,
    JobPostingsFetchError,
    JobWorkRegion,
} from "@/src/lib/api/jobs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getJobCursor, getJobFilters, getJobsHref, type JobFilters, type JobsSearchParams } from "@/src/lib/job-query";
import { getJobsListMetadata } from "@/src/lib/list-seo";

const PAGE_SIZE = 12;

const WORK_REGION_LABELS: Record<JobWorkRegion, string> = {
    SEOUL: "서울", BUSAN: "부산", DAEGU: "대구", INCHEON: "인천", GWANGJU: "광주", DAEJEON: "대전", ULSAN: "울산", SEJONG: "세종", GYEONGGI: "경기", GANGWON: "강원", CHUNGBUK: "충북", CHUNGNAM: "충남", JEONBUK: "전북", JEONNAM: "전남", GYEONGBUK: "경북", GYEONGNAM: "경남", JEJU: "제주", ETC: "기타",
};
const EMPLOYMENT_TYPE_LABELS: Record<JobEmploymentType, string> = {
    FULL_TIME: "정규직", CONTRACT: "계약직", PART_TIME: "파트타임", DISPATCH: "파견직", INTERN: "인턴", ETC: "기타",
};
const CLOSE_TYPE_LABELS: Record<JobCloseType, string> = {
    FIXED: "마감일 있음", ON_HIRE: "채용 시 마감", ONGOING: "상시 모집",
};
type Props = { searchParams: Promise<JobsSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    return getJobsListMetadata(await searchParams);
}

export default async function JobsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const filters = getJobFilters(resolvedSearchParams);
    const cursor = getJobCursor(resolvedSearchParams);
    const jobs = await fetchJobsSafely(filters, cursor);
    if (jobs == null) redirect(getJobsHref(filters, null));

    const { content, pageInfo } = jobs;
    const nextHref = pageInfo.hasNext && pageInfo.nextCursor ? getJobsHref(filters, pageInfo.nextCursor) : null;

    return (
        <div className="container mx-auto mb-5 px-4 py-10">
            <header className="mb-6 text-center">
                <p className="text-sm font-bold tracking-wide text-brand">NURSING CAREERS</p>
                <h1 className="mt-1 text-3xl font-bold text-foreground">간호 채용 공고</h1>
                <p className="mt-3 text-muted-foreground">간호 분야의 새로운 일자리를 한눈에 확인해보세요.</p>
            </header>

            <section className="mb-8 rounded-2xl border border-border/80 bg-background p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)] md:p-5" aria-label="채용 공고 필터">
                <JobFiltersForm
                    searchKeyword={filters.searchKeyword}
                    workRegion={filters.workRegion ?? ""}
                    employmentType={filters.employmentType ?? ""}
                    closeType={filters.closeType ?? ""}
                    workRegionOptions={[{ value: "", label: "전체 지역" }, ...JOB_WORK_REGIONS.map((value) => ({ value, label: WORK_REGION_LABELS[value] }))]}
                    employmentTypeOptions={[{ value: "", label: "전체 고용 형태" }, ...JOB_EMPLOYMENT_TYPES.map((value) => ({ value, label: EMPLOYMENT_TYPE_LABELS[value] }))]}
                    closeTypeOptions={[{ value: "", label: "전체 마감 방식" }, ...JOB_CLOSE_TYPES.map((value) => ({ value, label: CLOSE_TYPE_LABELS[value] }))]}
                />
            </section>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{getResultSummary(filters)} · {pageInfo.pageSize}개 표시</p>
                {cursor && <Link className="text-sm font-semibold text-brand underline" href={getJobsHref(filters, null)}>첫 페이지로</Link>}
            </div>

            {content.length > 0 ? (
                <ul className="flex flex-col gap-4">
                    {content.map((job) => <li key={job.id}><JobPostingCard job={job} /></li>)}
                </ul>
            ) : (
                <section className="rounded-2xl border border-dashed border-input bg-background px-6 py-14 text-center">
                    <h2 className="text-xl font-bold text-foreground">조건에 맞는 채용 공고가 없어요</h2>
                    <p className="mt-2 text-muted-foreground">검색어나 필터를 조정해 다시 찾아보세요.</p>
                    <Link className={`${buttonVariants({ className: "mt-5 bg-primary text-white hover:bg-primary/90" })}`} href="/jobs">전체 채용 공고 보기</Link>
                </section>
            )}

            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="채용 공고 페이지 이동">
                {nextHref ? (
                    <Link href={nextHref} className={buttonVariants({ variant: "outline", className: "h-10 border-input bg-background px-5 font-semibold text-foreground hover:border-brand hover:text-brand" })}>
                        다음 채용 공고 보기
                    </Link>
                ) : (
                    <span className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-subtle-foreground">마지막 목록입니다</span>
                )}
            </nav>
        </div>
    );
}

async function fetchJobsSafely(filters: JobFilters, cursor: string | null) {
    try {
        return await fetchJobPostings({
            cursor,
            searchKeyword: filters.searchKeyword,
            workRegions: filters.workRegion ? [filters.workRegion] : [],
            employmentTypes: filters.employmentType ? [filters.employmentType] : [],
            closeTypes: filters.closeType ? [filters.closeType] : [],
            size: PAGE_SIZE,
        });
    } catch (error) {
        if (cursor != null && error instanceof JobPostingsFetchError && error.status === 400) return null;
        throw error;
    }
}

function getResultSummary(filters: JobFilters): string {
    const conditions = [
        filters.searchKeyword && `“${filters.searchKeyword}” 검색`,
        filters.workRegion && WORK_REGION_LABELS[filters.workRegion],
        filters.employmentType && EMPLOYMENT_TYPE_LABELS[filters.employmentType],
        filters.closeType && CLOSE_TYPE_LABELS[filters.closeType],
    ].filter(Boolean);
    return conditions.length > 0 ? conditions.join(" · ") : "최신 채용 공고";
}
