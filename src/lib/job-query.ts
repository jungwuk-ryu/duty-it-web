export const JOB_WORK_REGIONS = ["SEOUL", "BUSAN", "DAEGU", "INCHEON", "GWANGJU", "DAEJEON", "ULSAN", "SEJONG", "GYEONGGI", "GANGWON", "CHUNGBUK", "CHUNGNAM", "JEONBUK", "JEONNAM", "GYEONGBUK", "GYEONGNAM", "JEJU", "ETC"] as const;
export const JOB_EMPLOYMENT_TYPES = ["FULL_TIME", "CONTRACT", "PART_TIME", "DISPATCH", "INTERN", "ETC"] as const;
export const JOB_CLOSE_TYPES = ["FIXED", "ON_HIRE", "ONGOING"] as const;
export type JobWorkRegion = typeof JOB_WORK_REGIONS[number];
export type JobEmploymentType = typeof JOB_EMPLOYMENT_TYPES[number];
export type JobCloseType = typeof JOB_CLOSE_TYPES[number];

type QueryValue = string | string[] | null;
export type JobsSearchParams = {
  cursor?: QueryValue; q?: QueryValue; searchKeyword?: QueryValue;
  region?: QueryValue; employmentType?: QueryValue; closeType?: QueryValue;
};
export type JobFilters = {
  searchKeyword: string;
  workRegion: JobWorkRegion | null;
  employmentType: JobEmploymentType | null;
  closeType: JobCloseType | null;
};

function first(value: QueryValue | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function option<T extends string>(value: QueryValue | undefined, options: readonly T[]): T | null {
  const selected = first(value);
  return options.find((item) => item === selected) ?? null;
}

export function getJobCursor(params: JobsSearchParams): string | null {
  return first(params.cursor)?.trim().slice(0, 512) || null;
}

export function getJobFilters(params: JobsSearchParams): JobFilters {
  return {
    searchKeyword: (first(params.q) ?? first(params.searchKeyword) ?? "").trim().slice(0, 80),
    workRegion: option(params.region, JOB_WORK_REGIONS),
    employmentType: option(params.employmentType, JOB_EMPLOYMENT_TYPES),
    closeType: option(params.closeType, JOB_CLOSE_TYPES),
  };
}

export function getJobsSearchParams(filters: JobFilters, cursor: string | null): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.searchKeyword) params.set("q", filters.searchKeyword);
  if (filters.workRegion) params.set("region", filters.workRegion);
  if (filters.employmentType) params.set("employmentType", filters.employmentType);
  if (filters.closeType) params.set("closeType", filters.closeType);
  if (cursor) params.set("cursor", cursor);
  return params;
}

export function getJobsHref(filters: JobFilters, cursor: string | null): string {
  const params = getJobsSearchParams(filters, cursor);
  return params.size > 0 ? `/jobs?${params}` : "/jobs";
}
