import type { JobPosting } from "@/src/lib/schemas/job";
import { getKoreanDate, parseJobDeadlineDate } from "./seo-date";

export function getJobValidThrough(job: Pick<JobPosting, "receiptCloseDt" | "expiresAt">): string | null {
    if (/채용\s*시|상시/.test(job.receiptCloseDt)) return null;
    // expiresAt is a sorting date at midnight, not an exact application deadline.
    const day = parseJobDeadlineDate(job.receiptCloseDt) ?? getKoreanDate(job.expiresAt);
    return day ? `${day}T23:59:59+09:00` : null;
}

export function isJobOpen(job: Pick<JobPosting, "isActive" | "receiptCloseDt" | "expiresAt">, now = new Date()): boolean {
    const deadline = getJobValidThrough(job);
    return job.isActive && (deadline == null || Date.parse(deadline) >= now.getTime());
}

export function getJobDeadlineLabel(receiptCloseDt: string): string {
    const value = receiptCloseDt.trim();
    const match = parseJobDeadlineDate(value)?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return value || "마감일 미정";

    const [, year, month, day] = match;
    return `${year}. ${Number(month)}. ${Number(day)}.`;
}

export function getJobDday(receiptCloseDt: string, now = new Date()): string | null {
    const match = parseJobDeadlineDate(receiptCloseDt)?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const [, year, month, day] = match;
    const deadline = Date.UTC(Number(year), Number(month) - 1, Number(day));
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1_000);
    const today = Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate());
    const difference = Math.round((deadline - today) / 86_400_000);

    if (difference < 0) return "마감";
    if (difference === 0) return "D-Day";
    return `D-${difference}`;
}

export function getJobEmploymentSummary(job: JobPosting): string {
    return job.empTpNm.split("/")[0]?.trim() || "고용 형태 미정";
}

export function getJobTitle(job: JobPosting): string {
    return job.wantedTitle || job.jobsNm || "제목 미정 채용 공고";
}
