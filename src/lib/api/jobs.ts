import "server-only";

import { JobPosting, JobPostingPage, JobPostingPageSchema, JobPostingSchema } from "@/src/lib/schemas/job";
import type { JobWorkRegion, JobEmploymentType, JobCloseType } from "../job-query";

export { JOB_WORK_REGIONS, JOB_EMPLOYMENT_TYPES, JOB_CLOSE_TYPES } from "../job-query";
export type { JobWorkRegion, JobEmploymentType, JobCloseType };

type FetchJobPostingsOptions = {
    cursor?: string | null;
    size?: number;
    workRegions?: JobWorkRegion[];
    employmentTypes?: JobEmploymentType[];
    closeTypes?: JobCloseType[];
    searchKeyword?: string | null;
};

const API_BASE = process.env.API_BASE!;

export class JobPostingsFetchError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly statusText: string,
        readonly responseBody: unknown,
    ) {
        super(message);
        this.name = "JobPostingsFetchError";
    }
}

export async function fetchJobPostings(options: FetchJobPostingsOptions = {}, request?: { cache: "no-store"; signal: AbortSignal }): Promise<JobPostingPage> {
    const {
        cursor = null,
        size = 12,
        workRegions = [],
        employmentTypes = [],
        closeTypes = [],
        searchKeyword = null,
    } = options;
    const params = new URLSearchParams({
        size: `${size}`,
        bookmarked: "false",
    });

    if (cursor) params.set("cursor", cursor);
    if (searchKeyword?.trim()) params.set("searchKeyword", searchKeyword.trim());
    workRegions.forEach((region) => params.append("workRegions", region));
    employmentTypes.forEach((type) => params.append("employmentTypes", type));
    closeTypes.forEach((type) => params.append("closeTypes", type));

    const response = await fetch(`${API_BASE}/v1/job-postings?${params.toString()}`, {
        ...(request ? { cache: request.cache } : { next: { revalidate: 60 } }),
        signal: request?.signal ?? AbortSignal.timeout(15_000),
    });
    const json = await getResponseJson(response);

    if (!response.ok) {
        throw new JobPostingsFetchError("Failed to fetch job postings", response.status, response.statusText, json);
    }

    const parsed = JobPostingPageSchema.safeParse(json);
    if (!parsed.success) {
        console.error(parsed.error.issues);
        throw new Error("Failed to parse job postings response.");
    }

    return parsed.data;
}

export async function fetchJobPosting(jobPostingId: number): Promise<JobPosting> {
    const response = await fetch(`${API_BASE}/v1/job-postings/${jobPostingId}`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(15_000),
    });
    const json = await getResponseJson(response);

    if (!response.ok) {
        throw new JobPostingsFetchError("Failed to fetch job posting", response.status, response.statusText, json);
    }

    const parsed = JobPostingSchema.safeParse(json);
    if (!parsed.success) {
        console.error(parsed.error.issues);
        throw new Error("Failed to parse job posting response.");
    }

    return parsed.data;
}

async function getResponseJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
